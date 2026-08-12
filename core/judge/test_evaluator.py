#!/usr/bin/env python3
"""
core/judge/test_evaluator.py

Smoke tests for TestCaseEvaluator (Milestone 2).

Tests use in-memory test cases from core.judge.fixtures so no live database
is required.  Each test submits a known-correct or known-wrong solution and
asserts the expected aggregate verdict and pass count.

Run from the project root:

    venv/bin/python core/judge/test_evaluator.py
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from core.judge.evaluator import TestCaseEvaluator, ExecutionStatus, outputs_match
from core.judge.fixtures import SAMPLE_CHALLENGES
from core.judge.runner import RunnerConfig

GREEN = "\033[92m"
RED   = "\033[91m"
CYAN  = "\033[96m"
RESET = "\033[0m"


def _ok(label: str, detail: str = "") -> None:
    print(f"{GREEN}[PASS]{RESET} {label}" + (f"  —  {detail}" if detail else ""))


def _fail(label: str, detail: str = "") -> None:
    print(f"{RED}[FAIL]{RESET} {label}" + (f"  —  {detail}" if detail else ""))


def _section(title: str) -> None:
    print(f"\n{CYAN}── {title}{RESET}")


# ---------------------------------------------------------------------------
# Unit tests for output comparison helper
# ---------------------------------------------------------------------------

def test_outputs_match_exact():
    assert outputs_match("42\n", "42"), "trailing newline should match"
    assert outputs_match("  42  \n", "42"), "surrounding spaces should match"
    assert outputs_match("hello\r\nworld\r\n", "hello\nworld"), "CRLF should match LF"
    assert not outputs_match("42", "43"), "different values must not match"
    _ok("outputs_match (unit)")


# ---------------------------------------------------------------------------
# Evaluator integration tests (use DockerRunner)
# ---------------------------------------------------------------------------

def make_evaluator() -> TestCaseEvaluator:
    cfg = RunnerConfig(timeout_sec=10)
    return TestCaseEvaluator(runner_config=cfg)


# ── double_number ──────────────────────────────────────────────────────────

def test_double_number_ac():
    evaluator = make_evaluator()
    code = "def solution(n): return n * 2"
    result = evaluator.evaluate_with_cases(
        code=code,
        test_cases=SAMPLE_CHALLENGES["double_number"],
    )
    total = len(SAMPLE_CHALLENGES["double_number"])
    if result.status == ExecutionStatus.ACCEPTED and result.passed == total:
        _ok("double_number — AC", f"{result.passed}/{result.total} passed")
    else:
        _fail("double_number — AC", f"status={result.status} {result.passed}/{result.total}")
        for d in result.details:
            print(f"    tc={d.testcase_id} {d.status} actual={d.actual_output!r} expected={d.expected_output!r} err={d.stderr!r}")


def test_double_number_wa():
    evaluator = make_evaluator()
    code = "def solution(n): return n * 3"  # intentionally wrong
    result = evaluator.evaluate_with_cases(
        code=code,
        test_cases=SAMPLE_CHALLENGES["double_number"],
    )
    if result.status == ExecutionStatus.WRONG_ANSWER and result.passed == 1:
        # Only "0" case passes (0*3 == 0*2)
        _ok("double_number — WA (wrong multiplier)", f"{result.passed}/{result.total} passed")
    else:
        _fail("double_number — WA", f"status={result.status} {result.passed}/{result.total}")


# ── sum_two ────────────────────────────────────────────────────────────────

def test_sum_two_ac():
    evaluator = make_evaluator()
    code = "def solution(a, b): return a + b"
    result = evaluator.evaluate_with_cases(
        code=code,
        test_cases=SAMPLE_CHALLENGES["sum_two"],
    )
    total = len(SAMPLE_CHALLENGES["sum_two"])
    if result.status == ExecutionStatus.ACCEPTED and result.passed == total:
        _ok("sum_two — AC", f"{result.passed}/{result.total} passed")
    else:
        _fail("sum_two — AC", f"status={result.status} {result.passed}/{result.total}")
        for d in result.details:
            print(f"    tc={d.testcase_id} {d.status} actual={d.actual_output!r} expected={d.expected_output!r}")


# ── reverse_string ────────────────────────────────────────────────────────

def test_reverse_string_ac():
    evaluator = make_evaluator()
    code = "def solution(s): return s[::-1]"
    result = evaluator.evaluate_with_cases(
        code=code,
        test_cases=SAMPLE_CHALLENGES["reverse_string"],
    )
    total = len(SAMPLE_CHALLENGES["reverse_string"])
    if result.status == ExecutionStatus.ACCEPTED and result.passed == total:
        _ok("reverse_string — AC", f"{result.passed}/{result.total} passed")
    else:
        _fail("reverse_string — AC", f"status={result.status} {result.passed}/{result.total}")


# ── factorial ─────────────────────────────────────────────────────────────

def test_factorial_ac():
    evaluator = make_evaluator()
    code = (
        "import math\n"
        "def solution(n): return math.factorial(n)\n"
    )
    result = evaluator.evaluate_with_cases(
        code=code,
        test_cases=SAMPLE_CHALLENGES["factorial"],
    )
    total = len(SAMPLE_CHALLENGES["factorial"])
    if result.status == ExecutionStatus.ACCEPTED and result.passed == total:
        _ok("factorial — AC", f"{result.passed}/{result.total} passed")
    else:
        _fail("factorial — AC", f"status={result.status} {result.passed}/{result.total}")
        for d in result.details:
            print(f"    tc={d.testcase_id} {d.status} actual={d.actual_output!r} expected={d.expected_output!r}")


# ── runtime error propagation ─────────────────────────────────────────────

def test_re_propagation():
    evaluator = make_evaluator()
    code = "def solution(n): raise RuntimeError('crash')"
    result = evaluator.evaluate_with_cases(
        code=code,
        test_cases=SAMPLE_CHALLENGES["double_number"],
    )
    if result.status == ExecutionStatus.RUNTIME_ERROR and result.passed == 0:
        _ok("RE propagation", f"{result.passed}/{result.total} passed")
    else:
        _fail("RE propagation", f"status={result.status} {result.passed}/{result.total}")


# ── TLE propagation ───────────────────────────────────────────────────────

def test_tle_propagation():
    cfg       = RunnerConfig(timeout_sec=3)
    evaluator = TestCaseEvaluator(runner_config=cfg)
    code      = "def solution(n):\n    while True: pass"
    result    = evaluator.evaluate_with_cases(
        code=code,
        test_cases=SAMPLE_CHALLENGES["double_number"][:1],  # only 1 tc to save time
    )
    if result.status == ExecutionStatus.TIME_LIMIT_EXCEEDED and result.passed == 0:
        _ok("TLE propagation")
    else:
        _fail("TLE propagation", f"status={result.status}")


# ── empty test cases ──────────────────────────────────────────────────────

def test_empty_test_cases():
    evaluator = make_evaluator()
    result = evaluator.evaluate_with_cases(code="def solution(n): return 1", test_cases=[])
    if result.total == 0 and result.passed == 0 and result.status == ExecutionStatus.ACCEPTED:
        _ok("empty test cases — returns AC with 0/0")
    else:
        _fail("empty test cases", f"status={result.status} {result.passed}/{result.total}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

UNIT_TESTS = [
    test_outputs_match_exact,
]

INTEGRATION_TESTS = [
    test_double_number_ac,
    test_double_number_wa,
    test_sum_two_ac,
    test_reverse_string_ac,
    test_factorial_ac,
    test_re_propagation,
    test_tle_propagation,
    test_empty_test_cases,
]

if __name__ == "__main__":
    print("=" * 60)
    print("  TestCaseEvaluator smoke tests — Milestone 2")
    print("=" * 60)

    _section("Unit tests (no Docker)")
    for t in UNIT_TESTS:
        try:
            t()
        except Exception as exc:
            _fail(t.__name__, str(exc))

    _section("Integration tests (Docker required)")
    for t in INTEGRATION_TESTS:
        try:
            t()
        except Exception as exc:
            _fail(t.__name__, str(exc))

    print("\n" + "=" * 60)
