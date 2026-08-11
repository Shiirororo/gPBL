from django.test import TestCase
from django.urls import reverse


class ChallengeEndpointTests(TestCase):
    def test_challenge_create_route_exists(self):
        self.assertEqual(reverse('challenge-create'), '/challenge/')
