#!/usr/bin/env python3
"""
core/judge/test_runner.py

Smoke tests for DockerRunner.
Run from the project root:

    venv/bin/python core/judge/test_runner.py
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from core.judge.runner import DockerRunner, ExecutionStatus, RunnerConfig

GREEN = "\033[92m"
RED   = "\033[91m"
RESET = "\033[0m"


def _ok(label: str) -> None:
    print(f"{GREEN}[PASS]{RESET} {label}")


def _fail(label: str, detail: str = "") -> None:
    print(f"{RED}[FAIL]{RESET} {label}" + (f"  —  {detail}" if detail else ""))


# ---------------------------------------------------------------------------
# Test cases
# ---------------------------------------------------------------------------

def test_hello_world():
    """Basic stdout capture."""
    runner = DockerRunner()
    result = runner.run(code='print("Hello, World!")')
    if result.status == ExecutionStatus.ACCEPTED and "Hello, World!" in result.stdout:
        _ok("hello_world")
    else:
        _fail("hello_world", f"status={result.status!r}  stdout={result.stdout!r}  stderr={result.stderr!r}")


def test_stdin_echo():
    """Code reads from stdin and echoes it back."""
    code = "x = int(input()); print(x * 2)"
    runner = DockerRunner()
    result = runner.run(code=code, stdin_data="21\n")
    if result.status == ExecutionStatus.ACCEPTED and result.stdout.strip() == "42":
        _ok("stdin_echo")
    else:
        _fail("stdin_echo", f"status={result.status!r}  stdout={result.stdout!r}  stderr={result.stderr!r}")


def test_multiline_stdin():
    """Multiple input() calls."""
    code = (
        "a = int(input())\n"
        "b = int(input())\n"
        "print(a + b)\n"
    )
    runner = DockerRunner()
    result = runner.run(code=code, stdin_data="3\n7\n")
    if result.status == ExecutionStatus.ACCEPTED and result.stdout.strip() == "10":
        _ok("multiline_stdin")
    else:
        _fail("multiline_stdin", f"status={result.status!r}  stdout={result.stdout!r}  stderr={result.stderr!r}")


def test_runtime_error():
    """Uncaught exception → RE status."""
    runner = DockerRunner()
    result = runner.run(code="raise ValueError('boom')")
    if result.status == ExecutionStatus.RUNTIME_ERROR:
        _ok("runtime_error")
    else:
        _fail("runtime_error", f"status={result.status!r}")


def test_time_limit_exceeded():
    """Infinite loop → TLE status."""
    cfg    = RunnerConfig(timeout_sec=3)
    runner = DockerRunner(config=cfg)
    result = runner.run(code="while True: pass")
    if result.status == ExecutionStatus.TIME_LIMIT_EXCEEDED:
        _ok("time_limit_exceeded")
    else:
        _fail("time_limit_exceeded", f"status={result.status!r}")


def test_no_network():
    """Network access must fail inside the container."""
    code = (
        "import urllib.request\n"
        "try:\n"
        "    urllib.request.urlopen('http://example.com', timeout=2)\n"
        "    print('CONNECTED')\n"
        "except Exception:\n"
        "    print('BLOCKED')\n"
    )
    runner = DockerRunner()
    result = runner.run(code=code)
    if "BLOCKED" in result.stdout:
        _ok("no_network")
    else:
        _fail("no_network", f"stdout={result.stdout!r}  stderr={result.stderr!r}")


def test_no_filesystem_write():
    """Writing outside /tmp must be blocked (read-only FS)."""
    code = (
        "try:\n"
        "    open('/malicious.txt', 'w').write('pwned')\n"
        "    print('WROTE')\n"
        "except Exception:\n"
        "    print('BLOCKED')\n"
    )
    runner = DockerRunner()
    result = runner.run(code=code)
    if "BLOCKED" in result.stdout:
        _ok("no_filesystem_write")
    else:
        _fail("no_filesystem_write", f"stdout={result.stdout!r}  stderr={result.stderr!r}")


def test_tmp_writable():
    """/tmp must be writable for scratch space."""
    code = (
        "import tempfile\n"
        "with tempfile.NamedTemporaryFile(dir='/tmp', delete=False) as f:\n"
        "    f.write(b'ok')\n"
        "print('WROTE_TMP')\n"
    )
    runner = DockerRunner()
    result = runner.run(code=code)
    if result.status == ExecutionStatus.ACCEPTED and "WROTE_TMP" in result.stdout:
        _ok("tmp_writable")
    else:
        _fail("tmp_writable", f"status={result.status!r}  stdout={result.stdout!r}  stderr={result.stderr!r}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

TESTS = [
    test_hello_world,
    test_stdin_echo,
    test_multiline_stdin,
    test_runtime_error,
    test_time_limit_exceeded,
    test_no_network,
    test_no_filesystem_write,
    test_tmp_writable,
]

if __name__ == "__main__":
    print("=" * 55)
    print("  DockerRunner smoke tests")
    print("=" * 55)
    for t in TESTS:
        try:
            t()
        except Exception as exc:
            _fail(t.__name__, str(exc))
    print("=" * 55)
