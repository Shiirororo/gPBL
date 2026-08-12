
from models import TestCase

class TestCaseSerializer(TestCase):

    class Meta:
        model = TestCase
        fields = [
            "testcase_id",
            "input",
            "output",
            "is_hidden",
        ]
    def get_sample_test_case(self, validated_data):
        return TestCase.objects.filter(
            # challenge_id = challenge,

        )