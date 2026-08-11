"""
core/submissions/tests.py

Django test suite for the submission API (Milestone 3).

Uses Django's built-in test client + an in-memory SQLite database so no
live MySQL connection is needed.  The DockerRunner is mocked to keep tests
fast and deterministic — Docker integration is already covered by
core/judge/test_evaluator.py.

Run:
    cd src && python manage.py test core.submissions --verbosity=2
"""

from unittest.mock import patch, MagicMock

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from core.models import User, CodingChallenge, TestCase as TC, Result, UserCompletedChallenge
from core.judge.evaluator import EvaluationResult, TestCaseResult
from core.judge.runner import ExecutionStatus


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_user(username="testuser", password="pass1234") -> User:
    return User.objects.create_user(user_name=username, password=password)


def _make_challenge(title="Double Number", score=10) -> CodingChallenge:
    return CodingChallenge.objects.create(
        title=title,
        description="Print n*2",
        difficulty="easy",
        score=score,
    )


def _make_testcases(challenge: CodingChallenge):
    TC.objects.create(challenge=challenge, input="3\n",  output="6",  is_hidden=False)
    TC.objects.create(challenge=challenge, input="10\n", output="20", is_hidden=True)


def _jwt_client(user: User) -> APIClient:
    client = APIClient()
    token  = AccessToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return client


def _ac_eval_result(total=2) -> EvaluationResult:
    """Fake EvaluationResult where all test cases pass."""
    details = [
        TestCaseResult(
            testcase_id=i + 1,
            status=ExecutionStatus.ACCEPTED,
            actual_output=str((i + 1) * 6),
            expected_output=str((i + 1) * 6),
            runtime_ms=120,
            is_hidden=(i == 1),
        )
        for i in range(total)
    ]
    return EvaluationResult(
        status=ExecutionStatus.ACCEPTED,
        passed=total,
        total=total,
        details=details,
    )


def _wa_eval_result(total=2) -> EvaluationResult:
    details = [
        TestCaseResult(
            testcase_id=1,
            status=ExecutionStatus.WRONG_ANSWER,
            actual_output="99",
            expected_output="6",
            runtime_ms=110,
            is_hidden=False,
        ),
        TestCaseResult(
            testcase_id=2,
            status=ExecutionStatus.WRONG_ANSWER,
            actual_output="99",
            expected_output="20",
            runtime_ms=115,
            is_hidden=True,
        ),
    ]
    return EvaluationResult(
        status=ExecutionStatus.WRONG_ANSWER,
        passed=0,
        total=total,
        details=details,
    )


# ---------------------------------------------------------------------------
# POST /api/challenge/<id>/submit/
# ---------------------------------------------------------------------------

class SubmitViewTests(TestCase):

    def setUp(self):
        self.user       = _make_user()
        self.challenge  = _make_challenge()
        _make_testcases(self.challenge)
        self.client     = _jwt_client(self.user)
        self.url        = reverse("submit", kwargs={"challenge_id": self.challenge.challenge_id})

    # ── authentication ─────────────────────────────────────────────────

    def test_unauthenticated_returns_401(self):
        resp = APIClient().post(self.url, {"code": "print(1)"}, format="json")
        self.assertEqual(resp.status_code, 401)

    # ── validation ─────────────────────────────────────────────────────

    def test_missing_code_returns_400(self):
        resp = self.client.post(self.url, {}, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("code", resp.data)

    def test_blank_code_returns_400(self):
        resp = self.client.post(self.url, {"code": ""}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_oversized_code_returns_400(self):
        big_code = "x = 1\n" * 15_000        # well over 64 KB
        resp     = self.client.post(self.url, {"code": big_code}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_unknown_challenge_returns_404(self):
        url  = reverse("submit", kwargs={"challenge_id": 99999})
        with patch("core.submissions.views._service.submit",
                   side_effect=CodingChallenge.DoesNotExist):
            resp = self.client.post(url, {"code": "print(1)"}, format="json")
        self.assertEqual(resp.status_code, 404)

    # ── AC submission ──────────────────────────────────────────────────

    @patch("core.submissions.service.TestCaseEvaluator.evaluate")
    def test_ac_submission_returns_201(self, mock_eval):
        mock_eval.return_value = _ac_eval_result()
        resp = self.client.post(self.url, {"code": "print(int(input())*2)"}, format="json")

        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["status"], "AC")
        self.assertEqual(resp.data["passed_testcases"], 2)
        self.assertEqual(resp.data["total_testcases"], 2)
        self.assertEqual(len(resp.data["details"]), 2)

    @patch("core.submissions.service.TestCaseEvaluator.evaluate")
    def test_ac_creates_result_row(self, mock_eval):
        mock_eval.return_value = _ac_eval_result()
        self.client.post(self.url, {"code": "print(int(input())*2)"}, format="json")
        self.assertEqual(Result.objects.filter(user=self.user, challenge=self.challenge).count(), 1)
        result = Result.objects.get(user=self.user, challenge=self.challenge)
        self.assertEqual(result.submit_status, "AC")
        self.assertEqual(result.passed_testcases, 2)

    @patch("core.submissions.service.TestCaseEvaluator.evaluate")
    def test_first_ac_awards_score_and_completion(self, mock_eval):
        mock_eval.return_value = _ac_eval_result()
        self.client.post(self.url, {"code": "print(int(input())*2)"}, format="json")

        self.assertTrue(
            UserCompletedChallenge.objects.filter(user=self.user, challenge=self.challenge).exists()
        )
        self.user.refresh_from_db()
        self.assertEqual(self.user.score, self.challenge.score)

    @patch("core.submissions.service.TestCaseEvaluator.evaluate")
    def test_second_ac_does_not_double_award(self, mock_eval):
        mock_eval.return_value = _ac_eval_result()
        self.client.post(self.url, {"code": "print(int(input())*2)"}, format="json")
        self.client.post(self.url, {"code": "print(int(input())*2)"}, format="json")

        self.assertEqual(
            UserCompletedChallenge.objects.filter(user=self.user, challenge=self.challenge).count(),
            1,
        )
        self.user.refresh_from_db()
        self.assertEqual(self.user.score, self.challenge.score)   # not doubled

    # ── hidden test case redaction ─────────────────────────────────────

    @patch("core.submissions.service.TestCaseEvaluator.evaluate")
    def test_hidden_tc_output_is_redacted(self, mock_eval):
        mock_eval.return_value = _ac_eval_result()
        resp = self.client.post(self.url, {"code": "print(int(input())*2)"}, format="json")

        hidden = [d for d in resp.data["details"] if d["is_hidden"]]
        self.assertTrue(len(hidden) > 0)
        for d in hidden:
            self.assertIsNone(d["actual_output"])
            self.assertIsNone(d["expected_output"])

    @patch("core.submissions.service.TestCaseEvaluator.evaluate")
    def test_visible_tc_output_is_exposed(self, mock_eval):
        mock_eval.return_value = _ac_eval_result()
        resp = self.client.post(self.url, {"code": "print(int(input())*2)"}, format="json")

        visible = [d for d in resp.data["details"] if not d["is_hidden"]]
        self.assertTrue(len(visible) > 0)
        for d in visible:
            self.assertIsNotNone(d["actual_output"])
            self.assertIsNotNone(d["expected_output"])

    # ── WA submission ──────────────────────────────────────────────────

    @patch("core.submissions.service.TestCaseEvaluator.evaluate")
    def test_wa_submission_returns_201_with_wa_status(self, mock_eval):
        mock_eval.return_value = _wa_eval_result()
        resp = self.client.post(self.url, {"code": "print(99)"}, format="json")

        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["status"], "WA")
        self.assertEqual(resp.data["passed_testcases"], 0)

    @patch("core.submissions.service.TestCaseEvaluator.evaluate")
    def test_wa_does_not_award_score(self, mock_eval):
        mock_eval.return_value = _wa_eval_result()
        self.client.post(self.url, {"code": "print(99)"}, format="json")

        self.assertFalse(
            UserCompletedChallenge.objects.filter(user=self.user, challenge=self.challenge).exists()
        )
        self.user.refresh_from_db()
        self.assertEqual(self.user.score, 0)


# ---------------------------------------------------------------------------
# GET /api/challenge/<id>/submissions/
# ---------------------------------------------------------------------------

class SubmissionListViewTests(TestCase):

    def setUp(self):
        self.user      = _make_user()
        self.challenge = _make_challenge()
        self.client    = _jwt_client(self.user)
        self.url       = reverse("submission-list", kwargs={"challenge_id": self.challenge.challenge_id})

    def test_unauthenticated_returns_401(self):
        resp = APIClient().get(self.url)
        self.assertEqual(resp.status_code, 401)

    def test_unknown_challenge_returns_404(self):
        url  = reverse("submission-list", kwargs={"challenge_id": 99999})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 404)

    def test_empty_list_for_new_user(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data, [])

    def test_lists_own_submissions(self):
        Result.objects.create(
            user=self.user, challenge=self.challenge,
            submit="print(1)", submit_status="AC", passed_testcases=2,
        )
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["submit_status"], "AC")

    def test_does_not_leak_other_user_submissions(self):
        other = _make_user("other_user")
        Result.objects.create(
            user=other, challenge=self.challenge,
            submit="print(2)", submit_status="WA", passed_testcases=0,
        )
        resp = self.client.get(self.url)
        self.assertEqual(resp.data, [])


# ---------------------------------------------------------------------------
# GET /api/submissions/<result_id>/
# ---------------------------------------------------------------------------

class SubmissionDetailViewTests(TestCase):

    def setUp(self):
        self.user      = _make_user()
        self.challenge = _make_challenge()
        self.result    = Result.objects.create(
            user=self.user, challenge=self.challenge,
            submit="print(1)", submit_status="AC", passed_testcases=2,
        )
        self.client = _jwt_client(self.user)
        self.url    = reverse("submission-detail", kwargs={"result_id": self.result.result_id})

    def test_unauthenticated_returns_401(self):
        resp = APIClient().get(self.url)
        self.assertEqual(resp.status_code, 401)

    def test_returns_own_result(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["result_id"], self.result.result_id)
        self.assertEqual(resp.data["submit_status"], "AC")
        self.assertIn("submit", resp.data)

    def test_other_user_gets_404(self):
        other_client = _jwt_client(_make_user("another"))
        resp         = other_client.get(self.url)
        self.assertEqual(resp.status_code, 404)

    def test_nonexistent_result_returns_404(self):
        url  = reverse("submission-detail", kwargs={"result_id": 99999})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 404)
