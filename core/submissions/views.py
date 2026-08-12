"""
core/submissions/views.py

Submission API views.

Endpoints
---------
POST /api/challenge/<challenge_id>/submit/
    Submit Python code for a challenge.
    Requires JWT authentication.
    Runs code synchronously (Milestone 3); Celery async in Milestone 4.

GET  /api/challenge/<challenge_id>/submissions/
    List the authenticated user's past submissions for a challenge,
    ordered newest-first.

GET  /api/submissions/<result_id>/
    Retrieve a single submission result (must belong to the requesting user).
"""

from __future__ import annotations

import logging

from django.http import Http404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import CodingChallenge, Result
from .serializers import SubmitSerializer, SubmissionResultSerializer
from .service import SubmissionService

logger = logging.getLogger(__name__)

# One shared service instance — stateless, safe to reuse across requests.
_service = SubmissionService()


# ---------------------------------------------------------------------------
# POST /api/challenge/<challenge_id>/submit/
# ---------------------------------------------------------------------------

class SubmitView(APIView):
    """
    Submit Python code for a coding challenge.

    Request body
    ------------
    {
        "code": "<python source>"
    }

    Response 201
    ------------
    {
        "result_id":         <int>,
        "challenge_id":      <int>,
        "status":            "AC" | "WA" | "TLE" | "RE" | "IE",
        "passed_testcases":  <int>,
        "total_testcases":   <int>,
        "details": [
            {
                "testcase_id":     <int | null>,
                "status":          "AC" | "WA" | ...,
                "actual_output":   <str | null>,   # null for hidden cases
                "expected_output": <str | null>,   # null for hidden cases
                "stderr":          <str>,
                "runtime_ms":      <int>,
                "is_hidden":       <bool>
            },
            ...
        ]
    }

    Response 400  — invalid request body
    Response 404  — challenge not found
    Response 500  — internal runner error
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, challenge_id: int) -> Response:
        # ── validate request body ─────────────────────────────────────────
        serializer = SubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        code = serializer.validated_data["code"]

        # ── run evaluation pipeline ───────────────────────────────────────
        try:
            result_data = _service.submit(
                challenge_id=challenge_id,
                code=code,
                user=request.user,
            )
        except CodingChallenge.DoesNotExist:
            return Response(
                {"detail": f"Challenge {challenge_id} not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as exc:
            logger.exception(
                "Unexpected error during submission for challenge %s by user %s",
                challenge_id,
                request.user.user_id,
            )
            return Response(
                {"detail": "An internal error occurred. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # ── serialise and return ──────────────────────────────────────────
        out = SubmissionResultSerializer(result_data)
        return Response(out.data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# GET /api/challenge/<challenge_id>/submissions/
# ---------------------------------------------------------------------------

class SubmissionListView(APIView):
    """
    List the current user's past submissions for a given challenge.

    Response 200
    ------------
    [
        {
            "result_id":         <int>,
            "submit_status":     "AC" | "WA" | ...,
            "passed_testcases":  <int>,
            "timestamp":         "2026-08-11T10:00:00Z"
        },
        ...
    ]

    Results are ordered by timestamp descending (newest first).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, challenge_id: int) -> Response:
        if not CodingChallenge.objects.filter(pk=challenge_id).exists():
            return Response(
                {"detail": f"Challenge {challenge_id} not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        qs = (
            Result.objects
            .filter(user=request.user, challenge_id=challenge_id)
            .order_by("-timestamp")
            .values("result_id", "submit_status", "passed_testcases", "timestamp")
        )

        return Response(list(qs), status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# GET /api/submissions/<result_id>/
# ---------------------------------------------------------------------------

class SubmissionDetailView(APIView):
    """
    Retrieve a single past submission result.

    Only the submitting user may fetch their own result (returns 404 otherwise
    to avoid leaking the existence of other users' submissions).

    Response 200
    ------------
    {
        "result_id":         <int>,
        "challenge_id":      <int>,
        "submit_status":     "AC" | "WA" | ...,
        "passed_testcases":  <int>,
        "submit":            "<source code>",
        "timestamp":         "2026-08-11T10:00:00Z"
    }
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, result_id: int) -> Response:
        try:
            result = Result.objects.get(
                pk=result_id,
                user=request.user,   # ownership check
            )
        except Result.DoesNotExist:
            raise Http404

        data = {
            "result_id":        result.result_id,
            "challenge_id":     result.challenge_id,
            "submit_status":    result.submit_status,
            "passed_testcases": result.passed_testcases,
            "submit":           result.submit,
            "timestamp":        result.timestamp,
        }
        return Response(data, status=status.HTTP_200_OK)
