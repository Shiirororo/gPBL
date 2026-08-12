# Project Overview

This project is a Django-based coding challenge platform for learning Python.

Main goal:
- Users solve Python coding challenges.
- AI acts as a Coding Coach.
- AI should give hints, not complete solutions.
- AI supports Vietnamese, English, and Japanese.
- AI should keep conversation context for each challenge.
- Hint difficulty should increase gradually when the user still does not understand.

# Current Structure

- `core/ai/`
  - OpenAI integration
  - AI prompt logic
  - conversation / hint generation

- `core/challenge/`
  - coding challenges
  - challenge models
  - challenge views

- `.env`
  - OPEN_AI_KEY
  - OPEN_AI_MODEL

# AI Architecture

The intended flow is:

User question
→ Django backend
→ current challenge
→ current user code
→ conversation history
→ AI service
→ OpenAI API
→ hint response

AI conversations should eventually be stored in the database.

# AI Rules

When modifying AI-related code:

1. Do not hard-code the OpenAI API key.
2. Do not hard-code the model name.
3. Read configuration from `.env`.
4. Do not give users full coding challenge solutions.
5. Give one hint at a time.
6. Keep answers related to the current challenge.
7. Preserve conversation context.
8. Support Vietnamese, English, and Japanese.
9. Keep OpenAI logic inside `core/ai/`.
10. Keep code understandable for a student learning Django/Python.

# Current Development Status

Completed:
- OpenAI API key connection works.
- `.env` loading works.
- OpenAI Responses API test works.
- `generate_hint()` exists.
- Terminal multi-turn testing is being developed.

Next goals:
- Improve conversation history.
- Store AI conversations/messages in Django database.
- Connect AI service to Django API.
- Connect frontend AI chat to backend.