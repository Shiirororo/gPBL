"""
core/submissions/service.py

SubmissionService — orchestrates the full submission pipeline:

  1. Validate challenge exists.
  2. Load test cases (DB → in-memory fallback).
  3. Run code through TestCaseEvaluator (DockerRunner).
  4. Persist a Result row.
  5. On first-time AC: record UserCompletedChallenge and add score to User.
  6. Return a structured dict ready for SubmissionResultSerializer.

Keeping all DB writes and business logic here (not in the view) makes the
service easy to call from Celery workers in Milestone 4.
"""

from __future__ import annotations

import logging

from django.db import transaction

from core.models import CodingChallenge, Result, UserCompletedChallenge, User
from core.judge.evaluator import TestCaseEvaluator, EvaluationResult
from core.judge.runner import ExecutionStatus, RunnerConfig

logger = logging.getLogger(__name__)


class SubmissionService:
    """
    Synchronous submission handler.

    In Milestone 4 this will be wrapped in a Celery task; the logic stays here
    so both the sync view and the async task call the exact same code.
    """

    def __init__(self, runner_config: RunnerConfig | None = None):
        self._evaluator = TestCaseEvaluator(runner_config=runner_config)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def submit(
        self,
        *,
        challenge_id: int,
        code: str,
        user: User,
    ) -> dict:
        """
        Run *code* against all test cases for *challenge_id*.

        Parameters
        ----------
        challenge_id : DB pk of the CodingChallenge.
        code         : Python source code from the user.
        user         : Authenticated User model instance.

        Returns
        -------
        dict ready to be fed into SubmissionResultSerializer.

        Raises
        ------
        CodingChallenge.DoesNotExist  if challenge_id is invalid.
        """
        challenge = CodingChallenge.objects.get(pk=challenge_id)

        # ── evaluate ─────────────────────────────────────────────────────
        eval_result: EvaluationResult = self._evaluator.evaluate(
            challenge_id=challenge_id,
            code=code,
        )

        # ── persist & award score ─────────────────────────────────────────
        result_row = self._persist(
            user=user,
            challenge=challenge,
            code=code,
            eval_result=eval_result,
        )

        # ── build response dict ───────────────────────────────────────────
        return self._build_response(
            result_id=result_row.result_id,
            challenge_id=challenge_id,
            eval_result=eval_result,
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @transaction.atomic
    def _persist(
        self,
        *,
        user: User,
        challenge: CodingChallenge,
        code: str,
        eval_result: EvaluationResult,
    ) -> Result:
        """
        Write a Result row and optionally a UserCompletedChallenge row.

        Wrapped in a transaction so a DB error doesn't leave orphaned rows.
        """
        result_row = Result.objects.create(
            user=user,
            challenge=challenge,
            submit=code,
            submit_status=eval_result.status.value,
            passed_testcases=eval_result.passed,
        )

        # First-time AC → award score
        if eval_result.status == ExecutionStatus.ACCEPTED and eval_result.total > 0:
            already_completed = UserCompletedChallenge.objects.filter(
                user=user,
                challenge=challenge,
            ).exists()

            if not already_completed:
                UserCompletedChallenge.objects.create(
                    user=user,
                    challenge=challenge,
                )
                # Increment user score atomically
                User.objects.filter(pk=user.pk).update(
                    score=user.__class__.objects.get(pk=user.pk).score + challenge.score
                )
                logger.info(
                    "User %s first-time AC on challenge %s — awarded %s points",
                    user.user_name, challenge.challenge_id, challenge.score,
                )

        return result_row

    @staticmethod
    def _build_response(
        *,
        result_id: int | None,
        challenge_id: int,
        eval_result: EvaluationResult,
    ) -> dict:
        """Convert EvaluationResult into the serializer-ready dict."""
        details = [
            {
                "testcase_id":     tc.testcase_id,
                "status":          tc.status.value,
                "actual_output":   tc.actual_output,
                "expected_output": tc.expected_output,
                "stderr":          tc.stderr,
                "runtime_ms":      tc.runtime_ms,
                "is_hidden":       tc.is_hidden,
            }
            for tc in eval_result.details
        ]

        return {
            "result_id":        result_id,
            "challenge_id":     challenge_id,
            "status":           eval_result.status.value,
            "passed_testcases": eval_result.passed,
            "total_testcases":  eval_result.total,
            "details":          details,
        }
