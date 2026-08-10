import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")

client = OpenAI(
    api_key=os.getenv("OPEN_AI_KEY")
)

MODEL = os.getenv("OPEN_AI_MODEL")

def generate_hint(
    problem_description,
    user_code,
    user_question,
    history="",
    hint_level=1
):
    prompt = f"""
Bạn là AI Coding Coach hỗ trợ người dùng học lập trình.

NGÔN NGỮ:
- Hỗ trợ tiếng Việt, tiếng Anh và tiếng Nhật.
- Trả lời bằng cùng ngôn ngữ với câu hỏi của người dùng.

BÀI TOÁN:
{problem_description}

CODE HIỆN TẠI:
{user_code}

CÂU HỎI:
{user_question}

LỊCH SỬ:
{history}

HINT LEVEL:
{hint_level}

QUY TẮC:
1. Không đưa lời giải hoàn chỉnh.
2. Mỗi lần chỉ đưa một gợi ý.
3. Level 1: gợi ý nhẹ.
4. Level 2: chỉ rõ phần logic cần kiểm tra.
5. Level 3: giải thích concept rõ hơn.
6. Không lặp lại gợi ý đã có trong lịch sử.
"""

    response = client.responses.create(
        model=MODEL,
        input=prompt
    )

    return response.output_text