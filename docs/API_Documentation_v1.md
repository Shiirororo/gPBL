# Judge Engine API Documentation (v1)

This document provides a comprehensive guide to the Judge Engine API, including server initialization, available endpoints, and the business flow for each API operation.

---

## 1. Server Initialization

Before starting the Django server, ensure the execution environment is properly configured. The Judge Engine relies on a running Docker daemon to execute untrusted code in isolated containers.

### Prerequisites
- Python 3.12+
- Docker Daemon running (used by the `DockerRunner` service)
- MySQL database (or SQLite for local development)

### Setup Instructions

1. **Virtual Environment Setup:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   *(Ensure `docker>=7.0.0` is installed for the Python Docker SDK).*

3. **Environment Variables:**
   Configure your database connection by setting the following environment variables (or rely on the defaults mapped in `config/settings.py`):
   - `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`

4. **Database Migrations:**
   ```bash
   cd src
   python manage.py makemigrations core
   python manage.py migrate
   ```

5. **Start the Development Server:**
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

6. **Verify Docker Access:**
   Ensure the user running the Django server has permissions to communicate with the Docker daemon (e.g., belongs to the `docker` group). The engine will automatically pull the `python:3.12-slim` image upon the first execution if it is not present.

---

## 2. API Endpoints

All endpoints (except registration) require JWT authentication.
Include the token in the request header: `Authorization: Bearer <your_access_token>`

### 2.1 Authentication APIs

#### 2.1.1 Register User
- **URL:** `POST /api/auth/register/`
- **Permission:** AllowAny
- **Request Body:**
  ```json
  {
      "user_name": "testuser",
      "password": "securepassword123"
  }
  ```
- **Response (201 Created):**
  ```json
  {
      "user_id": 1,
      "user_name": "testuser"
  }
  ```
- **Business Flow:**
  Validates input, hashes the password, creates a new `User` in the database, and returns the new user's ID and name.

#### 2.1.2 Login (Obtain Token)
- **URL:** `POST /api/auth/login/`
- **Permission:** AllowAny
- **Request Body:**
  ```json
  {
      "user_name": "testuser",
      "password": "securepassword123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
      "refresh": "eyJhbG...",
      "access": "eyJhbG..."
  }
  ```
- **Business Flow:**
  Authenticates the user credentials and returns a pair of JWTs (access and refresh tokens). The access token is used to authenticate subsequent API requests.

#### 2.1.3 Refresh Token
- **URL:** `POST /api/auth/refresh/`
- **Permission:** AllowAny
- **Request Body:**
  ```json
  {
      "refresh": "eyJhbG..."
  }
  ```
- **Response (200 OK):**
  ```json
  {
      "access": "eyJhbG..."
  }
  ```
- **Business Flow:**
  Validates the refresh token and issues a new access token without requiring the user to re-enter their credentials.

---

### 2.2 Submission APIs

#### 2.2.1 Submit Code
- **URL:** `POST /api/challenge/<int:challenge_id>/submit/`
- **Permission:** IsAuthenticated
- **Request Body:**
  ```json
  {
      "code": "print(int(input()) * 2)"
  }
  ```
- **Response (201 Created):**
  ```json
  {
      "result_id": 105,
      "challenge_id": 1,
      "status": "AC",
      "passed_testcases": 2,
      "total_testcases": 2,
      "details": [
          {
              "testcase_id": 10,
              "status": "AC",
              "actual_output": "42",
              "expected_output": "42",
              "stderr": "",
              "runtime_ms": 120,
              "is_hidden": false
          },
          {
              "testcase_id": 11,
              "status": "AC",
              "actual_output": null,
              "expected_output": null,
              "stderr": "",
              "runtime_ms": 115,
              "is_hidden": true
          }
      ]
  }
  ```
- **Business Flow:**
  1. **Validation:** Validates that the code is not empty and is under 64 KB.
  2. **Test Case Retrieval:** Fetches all test cases associated with the `challenge_id` from the database.
  3. **Execution Pipeline (DockerRunner):**
     - For each test case, creates an isolated Docker container (`python:3.12-slim`).
     - Injects the test case `input` securely without socket piping.
     - Runs the user's code with strict limits (No Network, 256MB RAM, Read-only FS, Nobody User).
     - Collects `stdout`, `stderr`, and exit codes.
  4. **Evaluation:** Compares normalized `stdout` against `expected_output` (whitespace normalisation). Calculates the aggregate status (`AC`, `WA`, `TLE`, `RE`, `IE`).
  5. **Persistence:** Creates a `Result` record in the database.
  6. **Scoring:** If the aggregate status is `AC` and the user hasn't completed this challenge before, creates a `UserCompletedChallenge` record and atomically increments the user's score.
  7. **Response Formatting:** Returns the detailed results. Note that for `is_hidden=true` test cases, `actual_output` and `expected_output` are explicitly redacted (`null`) to prevent test-case leakage, while `stderr` remains visible for debugging.

#### 2.2.2 List User Submissions
- **URL:** `GET /api/challenge/<int:challenge_id>/submissions/`
- **Permission:** IsAuthenticated
- **Response (200 OK):**
  ```json
  [
      {
          "result_id": 105,
          "submit_status": "AC",
          "passed_testcases": 2,
          "timestamp": "2026-08-11T10:00:00Z"
      },
      {
          "result_id": 101,
          "submit_status": "WA",
          "passed_testcases": 0,
          "timestamp": "2026-08-11T09:45:00Z"
      }
  ]
  ```
- **Business Flow:**
  Verifies the challenge exists. Queries the `Result` table for all records matching the authenticated `user` and the requested `challenge_id`. Returns a lightweight summary list ordered chronologically (newest first).

#### 2.2.3 Get Submission Detail
- **URL:** `GET /api/submissions/<int:result_id>/`
- **Permission:** IsAuthenticated
- **Response (200 OK):**
  ```json
  {
      "result_id": 105,
      "challenge_id": 1,
      "submit_status": "AC",
      "passed_testcases": 2,
      "submit": "print(int(input()) * 2)",
      "timestamp": "2026-08-11T10:00:00Z"
  }
  ```
- **Business Flow:**
  Fetches the specific `Result` record by its `result_id`. Critically enforces ownership by filtering `user=request.user`. If a result exists but belongs to a different user, the API responds with a `404 Not Found` (rather than a 403) to prevent leaking the existence of other users' submissions. Returns the full submitted code and metadata.
