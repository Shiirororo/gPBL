from django.urls import reverse
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
