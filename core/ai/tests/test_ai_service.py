import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch

import httpx
from openai import APIConnectionError, APIError, APITimeoutError, RateLimitError

from core.ai import ai_service


VALID_INPUT = {
    "problem_description": "Find the sum of all elements in a list.",
    "user_code": "def total(numbers):\n    return 0",
    "user_question": "Where should I start?",
}


class GenerateHintTestCase(unittest.TestCase):
    def setUp(self):
        self.fake_client = Mock()
        self.fake_client.responses.create.return_value = SimpleNamespace(
            output_text="Consider which variable should accumulate each element."
        )

    def call_service(self, **overrides):
        arguments = {**VALID_INPUT, **overrides}
        with (
            patch.object(ai_service, "OPEN_AI_KEY", "test-key"),
            patch.object(ai_service, "MODEL", "test-model"),
            patch.object(ai_service, "client", self.fake_client),
        ):
            return ai_service.generate_hint(**arguments)

    def test_missing_api_key_raises_clear_configuration_error(self):
        with (
            patch.object(ai_service, "OPEN_AI_KEY", None),
            patch.object(ai_service, "MODEL", "test-model"),
        ):
            with self.assertRaisesRegex(
                ai_service.AIConfigurationError, "OPEN_AI_KEY"
            ):
                ai_service.generate_hint(**VALID_INPUT)

        # Kiểm tra cấu hình trước khi gọi API giúp báo đúng biến môi trường bị thiếu.

    def test_missing_model_raises_clear_configuration_error(self):
        with (
            patch.object(ai_service, "OPEN_AI_KEY", "test-key"),
            patch.object(ai_service, "MODEL", ""),
        ):
            with self.assertRaisesRegex(
                ai_service.AIConfigurationError, "OPEN_AI_MODEL"
            ):
                ai_service.generate_hint(**VALID_INPUT)

    def test_required_text_fields_must_be_non_empty_strings(self):
        for field_name in (
            "problem_description",
            "user_question",
        ):
            for invalid_value in (None, "", "   ", 123, []):
                with self.subTest(field=field_name, value=invalid_value):
                    with self.assertRaisesRegex(
                        ai_service.AIInputValidationError, field_name
                    ):
                        self.call_service(**{field_name: invalid_value})

        # Chuỗi chỉ có khoảng trắng không mang nội dung nên cũng được xem là rỗng.

    def test_user_code_may_be_empty_for_a_new_editor(self):
        result = self.call_service(user_code="")

        self.assertTrue(result)

        # Editor mới có thể chưa có code; câu hỏi vẫn được AI xử lý bình thường.

    def test_history_must_be_a_string(self):
        for invalid_history in (None, 123, []):
            with self.subTest(history=invalid_history):
                with self.assertRaisesRegex(
                    ai_service.AIInputValidationError, "history"
                ):
                    self.call_service(history=invalid_history)

    def test_text_fields_have_reasonable_length_limits(self):
        limits = {
            "problem_description": 10_000,
            "user_code": 20_000,
            "user_question": 2_000,
            "history": 20_000,
        }

        for field_name, maximum in limits.items():
            with self.subTest(field=field_name):
                with self.assertRaisesRegex(
                    ai_service.AIInputValidationError, field_name
                ):
                    self.call_service(**{field_name: "x" * (maximum + 1)})

        # Giới hạn độ dài tránh prompt quá lớn, giảm nguy cơ vượt context và tăng chi phí.

    def test_valid_input_calls_openai_and_returns_output_text(self):
        result = self.call_service(history="Previous hint")

        self.assertEqual(
            result, "Consider which variable should accumulate each element."
        )
        self.fake_client.responses.create.assert_called_once()

    def test_empty_ai_output_is_rejected(self):
        for invalid_output in (None, "", "   "):
            with self.subTest(output=invalid_output):
                self.fake_client.responses.create.return_value = SimpleNamespace(
                    output_text=invalid_output
                )
                with self.assertRaises(ai_service.AIServiceError):
                    self.call_service()

        # Không cho phép tầng database lưu một phản hồi AI rỗng như exchange hoàn tất.

    def test_prompt_lets_ai_choose_hint_depth_from_conversation(self):
        self.call_service(history="User: I still do not understand the previous hint.")

        prompt = self.fake_client.responses.create.call_args.kwargs["input"]
        self.assertIn("choose the appropriate hint depth", prompt)
        self.assertIn("Do not automatically increase", prompt)
        self.assertNotIn("CURRENT HINT LEVEL", prompt)

        # AI tự điều chỉnh độ rõ của gợi ý từ hội thoại, người dùng không cần chọn level.


class OpenAIErrorHandlingTestCase(unittest.TestCase):
    def make_request(self):
        return httpx.Request("POST", "https://api.openai.com/v1/responses")

    def make_rate_limit_error(self):
        request = self.make_request()
        response = httpx.Response(429, request=request)
        return RateLimitError("rate limited", response=response, body=None)

    def error_cases(self):
        request = self.make_request()
        return (
            (APITimeoutError(request), "timed out"),
            (self.make_rate_limit_error(), "rate limit"),
            (APIConnectionError(request=request), "connect"),
            (APIError("api failed", request, body=None), "OpenAI"),
        )

    def test_openai_errors_are_wrapped_in_service_error(self):
        for openai_error, expected_message in self.error_cases():
            with self.subTest(error_type=type(openai_error).__name__):
                fake_client = Mock()
                fake_client.responses.create.side_effect = openai_error

                with (
                    patch.object(ai_service, "OPEN_AI_KEY", "test-key"),
                    patch.object(ai_service, "MODEL", "test-model"),
                    patch.object(ai_service, "client", fake_client),
                ):
                    with self.assertRaisesRegex(
                        ai_service.AIServiceError, expected_message
                    ) as raised:
                        ai_service.generate_hint(**VALID_INPUT)

                self.assertIs(raised.exception.__cause__, openai_error)

        # Exception riêng giúp Django view ánh xạ lỗi dịch vụ thành HTTP status phù hợp mà không lộ chi tiết nội bộ.


if __name__ == "__main__":
    unittest.main()
