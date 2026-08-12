# gPBL System Architecture

The gPBL (Global Problem-Based Learning) project is a comprehensive platform for AI-assisted online coding challenges and competitive programming. This document outlines the architecture of the system, including the frontend, backend, database, code execution engine, and AI integration.

## 1. High-Level Overview

The system is composed of the following major components:
- **Frontend**: A modern Next.js web application providing the user interface.
- **Backend API**: A Django REST Framework (DRF) service handling business logic, authentication, and data orchestration.
- **Database**: A MySQL 8 relational database storing all persistent data.
- **Judge Service**: A secure, isolated Docker-based execution environment for evaluating user-submitted code.
- **AI Coach**: An integration with OpenAI's Chat Completions API to provide contextual programming hints.

---

## 2. Frontend Architecture

The frontend is built using **Next.js 16** (App Router) and **React 19**.

### Key Technologies
- **Styling**: Tailwind CSS, Shadcn UI components.
- **State & Data Fetching**: Standard Next.js server components and client-side fetching with custom wrappers.
- **Editor**: Monaco Editor (`@monaco-editor/react`) for code editing.
- **Authentication**: JWT-based authentication with access and refresh tokens stored securely (managed by custom `backendFetch` wrappers).

### Structure
- `app/`: Next.js App Router definitions (pages, layouts, API routes).
- `features/`: Domain-specific logic grouped by feature (auth, challenges, submissions, ai).
- `components/`: Shared UI components.
- `lib/`: Utility functions, API clients, environment configuration.

---

## 3. Backend Architecture

The backend is a **Django** application serving a REST API.

### Key Technologies
- **Framework**: Django 6.x + Django REST Framework (DRF).
- **Authentication**: `djangorestframework-simplejwt` for stateless JWT authentication.
- **Containerization SDK**: `docker-py` for managing isolated code execution containers.
- **AI Integration**: `openai` Python SDK.

### Modules (`core/`)
- **`auth/`**: Registration, login, and JWT token management.
- **`challenge/`**: Retrieval of coding challenges and related metadata.
- **`submissions/`**: API for submitting code and viewing past submission results.
- **`judge/`**: The core execution engine (see Section 5).
- **`ai/`**: Orchestrates conversations with the AI coach, managing exchanges and state.
- **`user/`**: User profile and leaderboard management.

---

## 4. Database Schema

The persistent layer uses **MySQL 8** with constraints and indexing for performance.

### Core Tables
1. **`users`**: User accounts (custom model using `user_name` as identifier) and total scores.
2. **`coding_challenges`**: The problem descriptions, difficulty, and the `function_name` expected in the user's submission.
3. **`test_cases`**: The inputs (stored as JSON arrays) and expected outputs for the challenges. Can be public or hidden.
4. **`user_completed_challenges`**: A junction table tracking which user has completed which challenge (for scoring).
5. **`results`**: History of all submissions, including the code submitted, verdict, and passed testcases.

### AI Tables
1. **`ai_conversations`**: Tracks an active AI coaching session for a specific user and challenge, including the latest code draft.
2. **`ai_exchanges`**: Individual question/hint pairs within a conversation, containing the user's question, code snapshot, and the AI's response.

---

## 5. Judge Execution Engine (`core/judge/`)

The judge evaluates user submissions securely and efficiently.

### Execution Flow
1. **Submission**: User submits a Python function (e.g., `def solution(n): return n * 2`).
2. **Setup**: The backend loads test cases from the database. Test case inputs are formatted as JSON arrays (e.g., `[1, 2]`).
3. **Isolation**: A stateless Docker container (`python:3.12-slim`) is spun up with severe restrictions:
   - No network access (`--network=none`).
   - Read-only filesystem with limited `tmpfs`.
   - Capped memory (256MB), CPU quota, and PID limits to prevent fork bombs.
   - Runs as a non-root user (`nobody`).
4. **Evaluation**: A custom wrapper script inside the container:
   - Imports the user's code dynamically.
   - Locates the target function specified by the challenge's `function_name`.
   - Parses the JSON array input into function arguments.
   - Calls the function and prints the return value.
5. **Validation**: The host captures the container's standard output (or detects timeouts/crashes) and compares it against the expected output using whitespace normalization.
6. **Verdict**: The worst outcome among all test cases becomes the final status (`IE`, `CE`, `TLE`, `RE`, `WA`, `AC`).

---

## 6. AI Coaching System (`core/ai/`)

The AI acts as a tutor rather than a code generator.

### Interaction Flow
1. **Drafting**: The user's code is continuously autosaved to an active `ai_conversation`.
2. **Inquiry**: The user asks a question. The backend creates an `ai_exchange` capturing the question and the exact code snapshot at that moment.
3. **Prompt Construction**: The backend builds a prompt containing:
   - The original problem description.
   - The user's code snapshot.
   - The user's question.
   - Past conversation history for context.
   - Strict instructions to guide the user without revealing the full solution.
4. **Inference**: The backend calls the OpenAI Chat Completions API (`gpt-5.2`).
5. **Delivery**: The hint is saved to the exchange and returned to the frontend.

## 7. Configuration & Environment
- **`.env`**: Contains sensitive data (database credentials, JWT secrets, OpenAI API keys).
- **`next.config.ts`**: Frontend configuration, including `allowedDevOrigins` for LAN access and server action origins.
- **`config/settings.py`**: Django configuration loading from environment variables.
