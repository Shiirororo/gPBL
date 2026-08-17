from unittest.mock import patch

from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from core.models import CodingChallenge, Result, TestCase, User


class ChallengeCompletionRateTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(user_name="learner", password="pass1234")
        self.other_user = User.objects.create_user(user_name="other", password="pass1234")
        self.challenge = CodingChallenge.objects.create(
            title="Two Sum",
            description="Find two numbers.",
        )
        TestCase.objects.create(challenge=self.challenge, input=[1], output=1)
        TestCase.objects.create(challenge=self.challenge, input=[2], output=2)

        Result.objects.create(
            user=self.user,
            challenge=self.challenge,
            submit="first attempt",
            submit_status="WA",
            passed_testcases=1,
        )
        Result.objects.create(
            user=self.user,
            challenge=self.challenge,
            submit="later regression",
            submit_status="WA",
            passed_testcases=0,
        )
        Result.objects.create(
            user=self.other_user,
            challenge=self.challenge,
            submit="other user's solution",
            submit_status="AC",
            passed_testcases=2,
        )

        token = AccessToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_list_returns_best_testcase_completion_for_current_user(self):
        response = self.client.get(reverse("challenge-create"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["passed_testcases"], 1)
        self.assertEqual(response.data[0]["total_testcases"], 2)
        self.assertEqual(response.data[0]["completion_rate"], 50.0)

    def test_detail_returns_the_same_completion_rate(self):
        response = self.client.get(
            reverse("challenge-detail", kwargs={"challenge_id": self.challenge.pk})
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["completion_rate"], 50.0)

    def test_challenge_progress_requires_authentication(self):
        self.client.credentials()

        response = self.client.get(reverse("challenge-create"))

        self.assertEqual(response.status_code, 401)


class ChallengeStartTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(user_name="starter", password="pass1234")
        self.challenge = CodingChallenge.objects.create(
            title="Configurable AI lock",
            description="Verify the configured lock duration.",
        )

        token = AccessToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    @override_settings(AI_LOCK_DURATION_MINUTES=3)
    @patch("core.challenge.views.LockService.get_lock_expiry")
    @patch("core.challenge.views.LockService.create_ai_lock")
    def test_start_uses_configured_ai_lock_duration(
        self,
        create_ai_lock,
        get_lock_expiry,
    ):
        lock_expiry = timezone.now()
        create_ai_lock.return_value = object()
        get_lock_expiry.return_value = lock_expiry

        response = self.client.post(
            reverse("challenge-start", kwargs={"challenge_id": self.challenge.pk})
        )

        self.assertEqual(response.status_code, 201)
        create_ai_lock.assert_called_once_with(self.user, duration_minutes=3)
        self.assertEqual(response.data["ai_lock_duration_minutes"], 3)
        self.assertEqual(
            response.data["message"],
            "Challenge started successfully. AI assistance will be available in 3 minutes.",
        )
