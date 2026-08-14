from django.urls import reverse
from django.test import override_settings
from django.test.runner import DiscoverRunner
from django.urls import path
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from core.models import User
from core.user.views import UserProfileView


urlpatterns = [
    path("api/user/me/", UserProfileView.as_view(), name="user-me"),
]


class NoSystemCheckRunner(DiscoverRunner):
    def run_checks(self, databases):
        return []


@override_settings(ROOT_URLCONF=__name__)
class UserProfileAvatarTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(user_name="avatar-user", password="pass1234")
        token = AccessToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_profile_returns_default_avatar(self):
        response = self.client.get(reverse("user-me"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["avatar"], "Avatar01.png")

    def test_user_can_update_avatar_from_allowlist(self):
        response = self.client.patch(
            reverse("user-me"),
            {"avatar": "Avatar04.png"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["avatar"], "Avatar04.png")
        self.user.refresh_from_db()
        self.assertEqual(self.user.avatar, "Avatar04.png")

    def test_user_cannot_set_an_unknown_avatar(self):
        response = self.client.patch(
            reverse("user-me"),
            {"avatar": "../../secret.png"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.user.refresh_from_db()
        self.assertEqual(self.user.avatar, "Avatar01.png")

    def test_user_cannot_update_protected_profile_fields(self):
        response = self.client.patch(
            reverse("user-me"),
            {
                "user_name": "renamed-user",
                "score": 9999,
                "avatar": "Avatar05.png",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["user_name"], "avatar-user")
        self.assertEqual(response.data["score"], 0)
        self.assertEqual(response.data["avatar"], "Avatar05.png")
        self.user.refresh_from_db()
        self.assertEqual(self.user.user_name, "avatar-user")
        self.assertEqual(self.user.score, 0)
        self.assertEqual(self.user.avatar, "Avatar05.png")

    def test_profile_requires_authentication(self):
        self.client.credentials()

        response = self.client.get(reverse("user-me"))

        self.assertEqual(response.status_code, 401)
