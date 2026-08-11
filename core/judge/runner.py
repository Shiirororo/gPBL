"""
core/judge/runner.py

Docker Runner Service — executes untrusted Python code in isolated containers.

Security model:
  - --network=none          : no outbound network access
  - --memory / --mem-swap   : 256 MB hard RAM cap
  - --cpus                  : 1 logical CPU
  - --pids-limit            : 64 processes (fork-bomb protection)
  - --read-only + tmpfs     : no persistent filesystem writes
  - --user 65534:65534      : runs as nobody (non-root)
  - --cap-drop=ALL          : all Linux capabilities removed

Supports Python only (as per project spec).

Stdin strategy:
  Because the Docker SDK's attach_socket API is fragile across SDK versions,
  we use a simpler and more reliable approach: we embed the stdin payload
  directly inside the solution script using sys.stdin.read() injection via
  a wrapper that replaces builtins.input and sys.stdin before importing the
  user's solution module.  This avoids all socket-level stdin piping issues.
"""

import os
import stat
import uuid
import time
import tempfile
import textwrap
import logging
from dataclasses import dataclass
from enum import Enum

import docker
from docker.errors import DockerException, ImageNotFound, APIError

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Constants & configuration
# ---------------------------------------------------------------------------

PYTHON_IMAGE = "python:3.12-slim"

DEFAULT_MEMORY_LIMIT   = "256m"
DEFAULT_MEMSWAP_LIMIT  = "256m"
DEFAULT_CPU_QUOTA      = 100_000    # 1 logical CPU
DEFAULT_CPU_PERIOD     = 100_000
DEFAULT_PIDS_LIMIT     = 64
DEFAULT_TIMEOUT_SEC    = 10
DEFAULT_TMPFS_SIZE     = "64m"

CONTAINER_SANDBOX_DIR  = "/sandbox"
CONTAINER_SOLUTION     = f"{CONTAINER_SANDBOX_DIR}/solution.py"
CONTAINER_WRAPPER      = f"{CONTAINER_SANDBOX_DIR}/runner.py"


# ---------------------------------------------------------------------------
# Public data types
# ---------------------------------------------------------------------------

class ExecutionStatus(str, Enum):
    """Mirrors the judge verdicts used in Result.submit_status."""
    ACCEPTED             = "AC"
    WRONG_ANSWER         = "WA"
    TIME_LIMIT_EXCEEDED  = "TLE"
    RUNTIME_ERROR        = "RE"
    INTERNAL_ERROR       = "IE"


@dataclass
class RunnerConfig:
    """Tunable resource limits for a single container run."""
    memory_limit:  str = DEFAULT_MEMORY_LIMIT
    memswap_limit: str = DEFAULT_MEMSWAP_LIMIT
    cpu_quota:     int = DEFAULT_CPU_QUOTA
    cpu_period:    int = DEFAULT_CPU_PERIOD
    pids_limit:    int = DEFAULT_PIDS_LIMIT
    timeout_sec:   int = DEFAULT_TIMEOUT_SEC
    tmpfs_size:    str = DEFAULT_TMPFS_SIZE


@dataclass
class ExecutionResult:
    """
    Result returned by DockerRunner.run().

    Attributes
    ----------
    status:       Verdict enum value.
    stdout:       Raw captured standard output (str).
    stderr:       Raw captured standard error (str).
    exit_code:    Container process exit code (None if unavailable).
    runtime_ms:   Wall-clock execution time in milliseconds (approx).
    """
    status:     ExecutionStatus
    stdout:     str = ""
    stderr:     str = ""
    exit_code:  int | None = None
    runtime_ms: int = 0


# ---------------------------------------------------------------------------
# Wrapper template
# ---------------------------------------------------------------------------

# The wrapper script runs inside the container.
# It injects the stdin payload via io.StringIO so user code that calls
# input() or reads from sys.stdin works without any socket-level piping.
_WRAPPER_TEMPLATE = textwrap.dedent("""\
    import sys, io, runpy, builtins

    _STDIN_PAYLOAD = {stdin_payload!r}

    _stream = io.StringIO(_STDIN_PAYLOAD)
    sys.stdin = _stream

    _original_input = builtins.input
    def _patched_input(prompt=""):
        line = _stream.readline()
        if line.endswith("\\n"):
            line = line[:-1]
        return line
    builtins.input = _patched_input

    runpy.run_path({solution_path!r}, run_name="__main__")
""")


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------

class DockerRunner:
    """
    Executes a Python script inside a fully isolated Docker container.

    Usage
    -----
    ::

        runner = DockerRunner()
        result = runner.run(
            code='print(int(input()) * 2)',
            stdin_data='21\\n',
        )
        print(result.status, result.stdout)

    The runner is stateless; a new container is created and removed for every
    call to ``run()``.
    """

    def __init__(self, config: RunnerConfig | None = None):
        self.config = config or RunnerConfig()
        try:
            self._client = docker.from_env()
            self._client.ping()
        except DockerException as exc:
            raise RuntimeError(
                "Cannot connect to Docker daemon. "
                "Is Docker running and accessible?"
            ) from exc

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def run(
        self,
        code: str,
        stdin_data: str = "",
    ) -> ExecutionResult:
        """
        Execute *code* inside an isolated container.

        Parameters
        ----------
        code:       Python source code to execute.
        stdin_data: Text to pipe into the process stdin (e.g. test-case input).

        Returns
        -------
        ExecutionResult with status, stdout, stderr, exit_code, runtime_ms.
        """
        with tempfile.TemporaryDirectory(prefix="gpbl_judge_") as host_tmpdir:
            # ---- write solution.py ----------------------------------------
            solution_path = os.path.join(host_tmpdir, "solution.py")
            with open(solution_path, "w", encoding="utf-8") as fh:
                fh.write(code)

            # ---- write runner.py (wrapper that injects stdin) ---------------
            wrapper_src = _WRAPPER_TEMPLATE.format(
                stdin_payload=stdin_data,
                solution_path=CONTAINER_SOLUTION,
            )
            wrapper_path = os.path.join(host_tmpdir, "runner.py")
            with open(wrapper_path, "w", encoding="utf-8") as fh:
                fh.write(wrapper_src)

            # ---- fix permissions so nobody (65534) can read the sandbox ----
            # Dir: 755, files: 644
            os.chmod(host_tmpdir, stat.S_IRWXU | stat.S_IRGRP | stat.S_IXGRP |
                                   stat.S_IROTH | stat.S_IXOTH)  # 0o755
            for fname in (solution_path, wrapper_path):
                os.chmod(fname, stat.S_IRUSR | stat.S_IWUSR |
                                 stat.S_IRGRP | stat.S_IROTH)    # 0o644

            return self._run_container(host_code_dir=host_tmpdir)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _run_container(self, host_code_dir: str) -> ExecutionResult:
        """Spin up the container, wait for it, collect results."""
        cfg            = self.config
        container_name = f"gpbl_runner_{uuid.uuid4().hex[:12]}"
        tmpfs_spec     = {"/tmp": f"rw,noexec,nosuid,size={cfg.tmpfs_size}"}

        try:
            t_start = time.monotonic()

            container = self._client.containers.run(
                image=PYTHON_IMAGE,
                command=["python", "-u", CONTAINER_WRAPPER],
                stdin_open=False,
                detach=True,
                name=container_name,
                # ---- security -----------------------------------------------
                network_mode="none",
                read_only=True,
                tmpfs=tmpfs_spec,
                cap_drop=["ALL"],
                user="65534:65534",             # nobody
                security_opt=["no-new-privileges"],
                # ---- resource limits ----------------------------------------
                mem_limit=cfg.memory_limit,
                memswap_limit=cfg.memswap_limit,
                cpu_quota=cfg.cpu_quota,
                cpu_period=cfg.cpu_period,
                pids_limit=cfg.pids_limit,
                # ---- filesystem ---------------------------------------------
                volumes={
                    host_code_dir: {
                        "bind": CONTAINER_SANDBOX_DIR,
                        "mode": "ro",
                    }
                },
                environment={"PYTHONDONTWRITEBYTECODE": "1"},
                remove=False,
                auto_remove=False,
            )

            # ---- wait with timeout ------------------------------------------
            try:
                exit_result = container.wait(timeout=cfg.timeout_sec)
                elapsed_ms  = int((time.monotonic() - t_start) * 1000)

                exit_code = exit_result.get("StatusCode", -1)
                stdout    = container.logs(stdout=True,  stderr=False).decode("utf-8", errors="replace")
                stderr    = container.logs(stdout=False, stderr=True).decode("utf-8", errors="replace")

                status = ExecutionStatus.ACCEPTED if exit_code == 0 else ExecutionStatus.RUNTIME_ERROR

                return ExecutionResult(
                    status=status,
                    stdout=stdout,
                    stderr=stderr,
                    exit_code=exit_code,
                    runtime_ms=elapsed_ms,
                )

            except Exception as wait_exc:
                elapsed_ms = int((time.monotonic() - t_start) * 1000)

                # The Docker SDK can raise requests.exceptions.ConnectionError
                # wrapping urllib3.exceptions.ReadTimeoutError when the
                # container.wait() call times out.  Walk the cause chain and
                # check both type names and message text.
                def _is_timeout(exc: BaseException) -> bool:
                    while exc is not None:
                        name = type(exc).__name__
                        msg  = str(exc).lower()
                        if "timeout" in name.lower() or "timeout" in msg or "timed out" in msg:
                            return True
                        exc = exc.__cause__ or exc.__context__
                    return False

                if _is_timeout(wait_exc):
                    logger.warning(
                        "Container %s timed out after %ss",
                        container_name, cfg.timeout_sec,
                    )
                    return ExecutionResult(
                        status=ExecutionStatus.TIME_LIMIT_EXCEEDED,
                        stderr="Time limit exceeded.",
                        runtime_ms=elapsed_ms,
                    )

                logger.exception("Unexpected error while waiting for container %s", container_name)
                return ExecutionResult(
                    status=ExecutionStatus.INTERNAL_ERROR,
                    stderr=str(wait_exc),
                    runtime_ms=elapsed_ms,
                )

        except (ImageNotFound, APIError) as docker_exc:
            logger.exception("Docker API error for container %s", container_name)
            return ExecutionResult(
                status=ExecutionStatus.INTERNAL_ERROR,
                stderr=str(docker_exc),
            )

        finally:
            self._force_remove(container_name)

    def _force_remove(self, container_name: str) -> None:
        """Kill and remove a container by name, silently ignoring errors."""
        try:
            container = self._client.containers.get(container_name)
            container.remove(force=True)
        except Exception:
            pass
