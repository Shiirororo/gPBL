# core/judge/__init__.py
"""
core.judge — Docker-based code execution and evaluation engine.

Public API
----------
DockerRunner       — executes a single Python script in an isolated container.
RunnerConfig       — resource limit configuration for DockerRunner.
ExecutionResult    — result of a single container run.
ExecutionStatus    — verdict enum (AC, WA, TLE, RE, IE).

TestCaseEvaluator  — evaluates code against a set of test cases.
TestCaseData       — plain-Python test case (input + expected output).
EvaluationResult   — aggregate verdict + per-case detail.
TestCaseResult     — result for a single test case.
outputs_match      — normalised output comparison helper.
"""

from .runner import (
    DockerRunner,
    RunnerConfig,
    ExecutionResult,
    ExecutionStatus,
)

from .evaluator import (
    TestCaseEvaluator,
    TestCaseData,
    EvaluationResult,
    TestCaseResult,
    outputs_match,
)

__all__ = [
    # runner
    "DockerRunner",
    "RunnerConfig",
    "ExecutionResult",
    "ExecutionStatus",
    # evaluator
    "TestCaseEvaluator",
    "TestCaseData",
    "EvaluationResult",
    "TestCaseResult",
    "outputs_match",
]
