"""
core/submissions/serializers.py

Serializers for the submission pipeline.

SubmitSerializer        — validates POST /api/challenge/<id>/submit/
SubmissionResultSerializer — shapes the JSON response returned to the client
TestCaseResultSerializer   — per-test-case detail inside the response
                             (hidden test cases have their I/O redacted)
"""

from rest_framework import serializers

from core.models import CodingChallenge


# ---------------------------------------------------------------------------
# Request serializer
# ---------------------------------------------------------------------------

class SubmitSerializer(serializers.Serializer):
    """
    Validates the body of POST /api/challenge/<challenge_id>/submit/.

    Fields
    ------
    code : str  — Python source code submitted by the user.
    """

    code = serializers.CharField(
        allow_blank=False,
        trim_whitespace=False,
        error_messages={
            "blank":    "Submission code cannot be empty.",
            "required": "The 'code' field is required.",
        },
    )

    def validate_code(self, value: str) -> str:
        """Reject trivially huge payloads before they reach the runner."""
        max_bytes = 64 * 1024  # 64 KB
        if len(value.encode("utf-8")) > max_bytes:
            raise serializers.ValidationError(
                f"Submitted code exceeds the maximum allowed size of {max_bytes // 1024} KB."
            )
        return value


# ---------------------------------------------------------------------------
# Response serializers
# ---------------------------------------------------------------------------

class TestCaseResultSerializer(serializers.Serializer):
    """
    Serialises a single TestCaseResult from the evaluator.

    Accepts either a dict (from _build_response) or a TestCaseResult dataclass.
    Hidden test cases have their input/output fields replaced with null so
    users cannot reverse-engineer them from the API response.
    """

    testcase_id     = serializers.IntegerField(allow_null=True)
    status          = serializers.CharField()
    runtime_ms      = serializers.IntegerField()
    is_hidden       = serializers.BooleanField()

    # These are conditionally populated — null for hidden cases
    actual_output   = serializers.SerializerMethodField()
    expected_output = serializers.SerializerMethodField()
    stderr          = serializers.SerializerMethodField()

    @staticmethod
    def _get(obj, key: str):
        """Unified attribute/dict access."""
        return obj[key] if isinstance(obj, dict) else getattr(obj, key)

    def get_actual_output(self, obj) -> str | None:
        return None if self._get(obj, "is_hidden") else self._get(obj, "actual_output")

    def get_expected_output(self, obj) -> str | None:
        return None if self._get(obj, "is_hidden") else self._get(obj, "expected_output")

    def get_stderr(self, obj) -> str:
        # Always expose stderr so the user can debug their code.
        # Trim to 2 KB to avoid flooding the response.
        stderr = self._get(obj, "stderr") or ""
        return stderr[:2048]


class SubmissionResultSerializer(serializers.Serializer):
    """
    Top-level response body for POST /api/challenge/<id>/submit/.

    Shape
    -----
    {
        "result_id":         <int | null>,   # DB pk of the saved Result row
        "challenge_id":      <int>,
        "status":            "AC" | "WA" | "TLE" | "RE" | "IE",
        "passed_testcases":  <int>,
        "total_testcases":   <int>,
        "details":           [ { per-test-case objects } ]
    }
    """

    result_id        = serializers.IntegerField(allow_null=True)
    challenge_id     = serializers.IntegerField()
    status           = serializers.CharField()
    passed_testcases = serializers.IntegerField()
    total_testcases  = serializers.IntegerField()
    details          = TestCaseResultSerializer(many=True)
