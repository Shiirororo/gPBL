"""
core/judge/evaluator.py

TestCase Evaluator — Milestone 2.

Responsibilities
----------------
1. Load test cases for a challenge (from the Django ORM or a plain list).
2. Run each test case through DockerRunner (one container per test case).
3. Compare actual stdout vs expected output with whitespace-normalised matching.
4. Return a structured EvaluationResult containing the aggregate verdict and
   per-test-case detail.

Verdict priority (highest → lowest):
  IE  →  CE  →  TLE  →  RE  →  WA  →  AC

Usage
-----
::

    from core.judge.evaluator import TestCaseEvaluator, TestCaseData

    evaluator = TestCaseEvaluator()

    # --- Option A: load from Django ORM (requires Django to be set up) ------
    result = evaluator.evaluate(
        challenge_id=1,
        code='def solution(n): return n * 2',
    )

    # --- Option B: pass test cases directly (for local dev / unit tests) ----
    tc_list = [
        TestCaseData(input='[3]', expected_output='6'),
        TestCaseData(input='[10]', expected_output='20'),
    ]
    result = evaluator.evaluate_with_cases(
        code='def solution(n): return n * 2',
        test_cases=tc_list,
    )

    print(result.status, result.passed, '/', result.total)
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field

from .runner import DockerRunner, ExecutionStatus, RunnerConfig

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------

@dataclass
class TestCaseData:
    """
    Plain-Python representation of a single test case.

    Decoupled from Django ORM so the evaluator can be used without a database.

    Attributes
    ----------
    input:           Text fed to stdin (may be empty string).
    expected_output: Expected stdout after whitespace normalisation.
    testcase_id:     Optional DB pk — set when loaded from ORM.
    is_hidden:       Whether the test case is hidden from the user.
    """
    input:           str
    expected_output: str
    testcase_id:     int | None = None
    is_hidden:       bool = False


@dataclass
class TestCaseResult:
    """Result for a single test case."""
    testcase_id:     int | None
    status:          ExecutionStatus
    actual_output:   str = ""
    expected_output: str = ""
    stderr:          str = ""
    runtime_ms:      int = 0
    is_hidden:       bool = False


@dataclass
class EvaluationResult:
    """
    Aggregate result of running all test cases for a submission.

    Attributes
    ----------
    status:       Final verdict (worst status across all test cases).
    passed:       Number of test cases with status AC.
    total:        Total number of test cases evaluated.
    details:      Per-test-case results (hidden cases included).
    """
    status:  ExecutionStatus
    passed:  int
    total:   int
    details: list[TestCaseResult] = field(default_factory=list)

    @property
    def all_passed(self) -> bool:
        return self.passed == self.total and self.total > 0


# ---------------------------------------------------------------------------
# Output comparison
# ---------------------------------------------------------------------------

def _normalise(text) -> str:
    """
    Normalise output for comparison.

    Accepts strings *or* any JSON-serialisable Python object (list, int, …)
    because the DB ``output`` column is a JSONField and Django returns the
    already-deserialised value.

    Rules (mirrors competitive-programming judge conventions):
    - Non-string values are first serialised to compact JSON.
    - If the value *is* a string but happens to be valid JSON (e.g. the
      runner printed ``[0, 1]``), it is re-parsed and re-serialised with
      compact separators so that ``[0, 1]`` and ``[0,1]`` compare equal.
    - Strip leading/trailing whitespace from the whole output.
    - Strip trailing whitespace from every line.
    - Collapse CR+LF → LF.
    """
    if not isinstance(text, str):
        # Already a Python object from a JSONField — serialise canonically.
        text = json.dumps(text, separators=(",", ":"))
    else:
        # Try to re-serialise if the string is valid JSON so that whitespace
        # differences like "[0, 1]" vs "[0,1]" are eliminated.
        stripped = text.strip()
        try:
            parsed = json.loads(stripped)
            text = json.dumps(parsed, separators=(",", ":"))
        except (json.JSONDecodeError, ValueError):
            pass  # plain text output — leave as-is

    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = [line.rstrip() for line in text.splitlines()]
    return "\n".join(lines).strip()


def outputs_match(actual: str, expected: str) -> bool:
    """Return True if *actual* matches *expected* after normalisation."""
    return _normalise(actual) == _normalise(expected)


# ---------------------------------------------------------------------------
# Verdict priority
# ---------------------------------------------------------------------------

# Lower index = higher priority (worse outcome wins).
_VERDICT_PRIORITY: list[ExecutionStatus] = [
    ExecutionStatus.INTERNAL_ERROR,
    ExecutionStatus.TIME_LIMIT_EXCEEDED,
    ExecutionStatus.RUNTIME_ERROR,
    ExecutionStatus.WRONG_ANSWER,
    ExecutionStatus.ACCEPTED,
]


def _worse(a: ExecutionStatus, b: ExecutionStatus) -> ExecutionStatus:
    """Return whichever verdict has higher priority (is worse)."""
    idx_a = _VERDICT_PRIORITY.index(a) if a in _VERDICT_PRIORITY else len(_VERDICT_PRIORITY)
    idx_b = _VERDICT_PRIORITY.index(b) if b in _VERDICT_PRIORITY else len(_VERDICT_PRIORITY)
    return a if idx_a <= idx_b else b


# ---------------------------------------------------------------------------
# Evaluator
# ---------------------------------------------------------------------------

class TestCaseEvaluator:
    """
    Evaluates a code submission against a set of test cases.

    Parameters
    ----------
    runner_config:
        Optional ``RunnerConfig`` to control resource limits per container.
        Defaults to ``RunnerConfig()`` (256 MB RAM, 1 CPU, 10 s timeout).
    """

    def __init__(self, runner_config: RunnerConfig | None = None):
        self._runner = DockerRunner(config=runner_config)

    # ------------------------------------------------------------------
    # Primary public API
    # ------------------------------------------------------------------

    def evaluate(
        self,
        challenge_id: int,
        code: str,
    ) -> EvaluationResult:
        """
        Load test cases from the Django ORM and evaluate *code* against them.

        Falls back to an empty list if Django is not configured or the
        challenge has no test cases yet — callers should check
        ``result.total == 0`` and handle accordingly.

        Parameters
        ----------
        challenge_id: PK of the CodingChallenge.
        code:         Python source code submitted by the user.

        Returns
        -------
        EvaluationResult
        """
        test_cases, function_name = self._load_from_db(challenge_id)

        if not test_cases:
            logger.warning(
                "No test cases found in DB for challenge_id=%s. "
                "Returning empty EvaluationResult.",
                challenge_id,
            )
            return EvaluationResult(
                status=ExecutionStatus.ACCEPTED,
                passed=0,
                total=0,
            )

        return self.evaluate_with_cases(code=code, test_cases=test_cases, function_name=function_name)

    def evaluate_with_cases(
        self,
        code: str,
        test_cases: list[TestCaseData],
        function_name: str = "solution",
    ) -> EvaluationResult:
        """
        Evaluate *code* against the provided *test_cases* list directly.

        Use this when you want to bypass the ORM (e.g., unit tests, seeding).

        Parameters
        ----------
        code:       Python source code to evaluate.
        test_cases: List of TestCaseData instances to evaluate against.

        Returns
        -------
        EvaluationResult
        """
        if not test_cases:
            return EvaluationResult(
                status=ExecutionStatus.ACCEPTED,
                passed=0,
                total=0,
            )

        aggregate_status = ExecutionStatus.ACCEPTED
        passed           = 0
        details: list[TestCaseResult] = []

        for i, tc in enumerate(test_cases, start=1):
            logger.debug(
                "Running test case %d/%d (id=%s)",
                i, len(test_cases), tc.testcase_id,
            )

            exec_result = self._runner.run(
                code=code,
                stdin_data=tc.input,
                function_name=function_name,
            )

            # Determine per-case verdict
            if exec_result.status == ExecutionStatus.ACCEPTED:
                # Runner only sets AC when exit_code == 0.
                # We still need to check output correctness.
                if outputs_match(exec_result.stdout, tc.expected_output):
                    verdict = ExecutionStatus.ACCEPTED
                    passed += 1
                else:
                    verdict = ExecutionStatus.WRONG_ANSWER
            else:
                # RE, TLE, IE — propagate as-is
                verdict = exec_result.status

            details.append(TestCaseResult(
                testcase_id=tc.testcase_id,
                status=verdict,
                actual_output=exec_result.stdout,
                expected_output=tc.expected_output,
                stderr=exec_result.stderr,
                runtime_ms=exec_result.runtime_ms,
                is_hidden=tc.is_hidden,
            ))

            aggregate_status = _worse(aggregate_status, verdict)

        return EvaluationResult(
            status=aggregate_status,
            passed=passed,
            total=len(test_cases),
            details=details,
        )

    # ------------------------------------------------------------------
    # ORM loader
    # ------------------------------------------------------------------

    @staticmethod
    def _load_from_db(challenge_id: int) -> tuple[list[TestCaseData], str]:
        """
        Fetch all TestCase rows and the function_name for *challenge_id* from the Django ORM.

        Returns a tuple of (test_cases, function_name). If Django is not configured, the challenge does
        not exist, or there are no test cases, returns ([], "solution").
        """
        try:
            from core.models import CodingChallenge, TestCase  # noqa: PLC0415 (deferred import)

            try:
                challenge = CodingChallenge.objects.get(pk=challenge_id)
                function_name = challenge.function_name
            except CodingChallenge.DoesNotExist:
                return [], "solution"

            qs = (
                TestCase.objects
                .filter(challenge_id=challenge_id)
                .order_by("testcase_id")
                .values("testcase_id", "input", "output", "is_hidden")
            )

            test_cases = [
                TestCaseData(
                    testcase_id=row["testcase_id"],
                    input=(
                        row["input"]
                        if isinstance(row["input"], str)
                        else json.dumps(row["input"])
                    ),
                    expected_output=(
                        row["output"]
                        if isinstance(row["output"], str)
                        else json.dumps(row["output"], separators=(",", ":"))
                    ),
                    is_hidden=row["is_hidden"],
                )
                for row in qs
            ]
            return test_cases, function_name

        except Exception as exc:  # pragma: no cover
            logger.warning("Could not load test cases from DB: %s", exc)
            return [], "solution"
