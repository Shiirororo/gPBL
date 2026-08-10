from core.ai.ai_service import generate_hint

problem_description = """
Viết chương trình tìm số lớn nhất trong một mảng.
"""

user_code = """
numbers = [3, 8, 2, 10, 5]

max_number = 0

for x in numbers:
    if x > max_number:
        max_number = x

print(max_number)
"""

history = ""
hint_level = 1

while True:
    user_question = input("\nBạn: ")

    if user_question.lower() in ["exit", "quit"]:
        print("Đã kết thúc.")
        break

    answer = generate_hint(
        problem_description=problem_description,
        user_code=user_code,
        user_question=user_question,
        history=history,
        hint_level=hint_level
    )

    print("\nAI:", answer)

    # Lưu lại cuộc hội thoại
    history += f"""
User: {user_question}
AI: {answer}
"""

    # Tăng mức hint
    if hint_level < 3:
        hint_level += 1