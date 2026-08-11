"""
core/judge/fixtures.py

In-memory sample test cases for local development and testing.

Since the database is currently empty, this module provides a registry of
pre-defined test case sets that mirror what would live in the DB for common
coding challenges.  They are keyed by a human-readable slug so the evaluator
smoke tests can reference them without needing a live database.

These are NOT loaded automatically into the DB; they exist purely to let
Milestone 2 be tested end-to-end right now.  Once real challenges and test
cases are seeded into the database via the Django admin or migrations, the
live ``TestCaseEvaluator.evaluate(challenge_id=...)`` path should be used.

Usage
-----
::

    from core.judge.fixtures import SAMPLE_CHALLENGES

    tc_list = SAMPLE_CHALLENGES["double_number"]
    result  = evaluator.evaluate_with_cases(code=user_code, test_cases=tc_list)
"""

from .evaluator import TestCaseData

# ---------------------------------------------------------------------------
# Challenge: "double_number"
# Read one integer from stdin, print it doubled.
# ---------------------------------------------------------------------------
DOUBLE_NUMBER: list[TestCaseData] = [
    TestCaseData(input="0\n",    expected_output="0"),
    TestCaseData(input="1\n",    expected_output="2"),
    TestCaseData(input="21\n",   expected_output="42"),
    TestCaseData(input="-5\n",   expected_output="-10"),
    TestCaseData(input="1000\n", expected_output="2000", is_hidden=True),
]

# ---------------------------------------------------------------------------
# Challenge: "sum_two"
# Read two integers (one per line), print their sum.
# ---------------------------------------------------------------------------
SUM_TWO: list[TestCaseData] = [
    TestCaseData(input="1\n2\n",     expected_output="3"),
    TestCaseData(input="0\n0\n",     expected_output="0"),
    TestCaseData(input="-3\n3\n",    expected_output="0"),
    TestCaseData(input="100\n200\n", expected_output="300", is_hidden=True),
]

# ---------------------------------------------------------------------------
# Challenge: "fizzbuzz"
# Read N, print FizzBuzz from 1..N (one per line).
# ---------------------------------------------------------------------------
_FIZZBUZZ_EXPECTED_15 = "\n".join(
    "Fizz" * (i % 3 == 0) or "Buzz" * (i % 5 == 0) or str(i)
    if not (i % 3 == 0 and i % 5 == 0)
    else "FizzBuzz"
    for i in range(1, 16)
)

FIZZBUZZ: list[TestCaseData] = [
    TestCaseData(input="5\n",  expected_output="1\n2\nFizz\n4\nBuzz"),
    TestCaseData(input="15\n", expected_output=_FIZZBUZZ_EXPECTED_15, is_hidden=True),
]

# ---------------------------------------------------------------------------
# Challenge: "reverse_string"
# Read one line, print it reversed.
# ---------------------------------------------------------------------------
REVERSE_STRING: list[TestCaseData] = [
    TestCaseData(input="hello\n",  expected_output="olleh"),
    TestCaseData(input="abc\n",    expected_output="cba"),
    TestCaseData(input="racecar\n", expected_output="racecar"),
    TestCaseData(input="OpenAI\n",  expected_output="IAnepO", is_hidden=True),
]

# ---------------------------------------------------------------------------
# Challenge: "factorial"
# Read N (0 <= N <= 12), print N!
# ---------------------------------------------------------------------------
import math  # noqa: E402

FACTORIAL: list[TestCaseData] = [
    TestCaseData(input="0\n",  expected_output="1"),
    TestCaseData(input="1\n",  expected_output="1"),
    TestCaseData(input="5\n",  expected_output="120"),
    TestCaseData(input="10\n", expected_output=str(math.factorial(10))),
    TestCaseData(input="12\n", expected_output=str(math.factorial(12)), is_hidden=True),
]

# ---------------------------------------------------------------------------
# Registry — maps slug → test case list
# ---------------------------------------------------------------------------
SAMPLE_CHALLENGES: dict[str, list[TestCaseData]] = {
    "double_number":  DOUBLE_NUMBER,
    "sum_two":        SUM_TWO,
    "fizzbuzz":       FIZZBUZZ,
    "reverse_string": REVERSE_STRING,
    "factorial":      FACTORIAL,
}
