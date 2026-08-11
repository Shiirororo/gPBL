"""Manually test the OpenAI connection and multi-turn hint flow."""

import argparse
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Thêm project root để lệnh `python core/ai/test_connection.py` import được package core.

from core.ai import ai_service


SAMPLE_PROBLEM = """
Write a Python function that returns the largest number in a list.
The list can contain both positive and negative integers.
""".strip()

SAMPLE_CODE = """def find_max(numbers):
    largest = 0
    for number in numbers:
        if number > largest:
            largest = number
    return largest
"""


def check_configuration():
    """Validate the API key and model without sending an OpenAI request."""

    ai_service._validate_configuration()
    print("Configuration OK")
    print(f"Model: {ai_service.MODEL}")
    print("API key: configured (value hidden)")

    # Chỉ xác nhận key tồn tại; tuyệt đối không in giá trị secret ra terminal.


def read_multiline_code():
    """Read multiline code until the user enters /done."""

    print("Paste the current code. Enter /done on a new line to finish:")
    lines = []
    while True:
        line = input()
        if line.strip() == "/done":
            return "\n".join(lines)
        lines.append(line)


def format_history(history):
    """Format previous turns as context that includes code snapshots."""

    parts = []
    for turn_number, turn in enumerate(history, start=1):
        parts.append(
            f"TURN {turn_number}\n"
            f"USER QUESTION:\n{turn['question']}\n"
            f"CODE SNAPSHOT:\n{turn['code']}\n"
            f"AI HINT:\n{turn['hint']}"
        )
    return "\n\n---\n\n".join(parts)

    # Mỗi lượt giữ code riêng để AI nhìn thấy sự thay đổi thay vì chỉ thấy code mới nhất.


def run_chat():
    """Run an interactive chat loop using the OpenAI Responses API."""

    check_configuration()
    problem_description = SAMPLE_PROBLEM
    current_code = SAMPLE_CODE
    history = []

    print("\nAI Coding Coach connection test")
    print("Commands: /code, /show, /reset, /exit")

    while True:
        user_question = input("\nYou: ").strip()

        if user_question == "/exit":
            print("Test finished.")
            return
        if user_question == "/code":
            current_code = read_multiline_code()
            print("Current code updated.")
            continue
        if user_question == "/show":
            print(f"\nProblem:\n{problem_description}")
            print(f"\nCurrent code:\n{current_code}")
            print(f"\nSaved chat turns: {len(history)}")
            continue
        if user_question == "/reset":
            current_code = SAMPLE_CODE
            history = []
            print("Code and conversation history reset.")
            continue
        if not user_question:
            continue

        try:
            hint = ai_service.generate_hint(
                problem_description=problem_description,
                user_code=current_code,
                user_question=user_question,
                history=format_history(history),
            )
        except ai_service.AIConfigurationError as error:
            print(f"Configuration error: {error}")
            return
        except ai_service.AIInputValidationError as error:
            print(f"Invalid test input: {error}")
            continue
        except ai_service.AIServiceError as error:
            print(f"OpenAI request failed: {error}")
            continue

        print(f"\nAI: {hint}")
        history.append(
            {
                "question": user_question,
                "code": current_code,
                "hint": hint,
            }
        )

        # Chỉ thêm history sau khi API trả lời thành công để context không chứa lượt lỗi.


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check-config",
        action="store_true",
        help="Validate .env configuration without calling OpenAI.",
    )
    arguments = parser.parse_args()

    if arguments.check_config:
        check_configuration()
        return
    run_chat()


if __name__ == "__main__":
    main()
