# gPBL API Documentation

This document outlines all the available API endpoints in the gPBL backend, including authentication, challenges, and code submissions.

---

## 1. Authentication APIs

All authentication endpoints are located under `/api/auth/`.

### 1.1 Register User
- **Method**: `POST`
- **URL**: `/api/auth/register/`
- **Description**: Registers a new user with the system.
- **Request Body**:
  ```json
  {
      "user_name": "testuser",
      "password": "securepassword123"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
      "user_id": 1,
      "user_name": "testuser"
  }
  ```
- **Error (400 Bad Request)**: Returned if the `user_name` already exists or fields are missing.

### 1.2 Login (Get Token)
- **Method**: `POST`
- **URL**: `/api/auth/login/`
- **Description**: Authenticates a user and returns JWT tokens (access and refresh).
- **Request Body**:
  ```json
  {
      "user_name": "testuser",
      "password": "securepassword123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
      "refresh": "eyJhbGciOi...",
      "access": "eyJhbGciOi..."
  }
  ```

### 1.3 Refresh Token
- **Method**: `POST`
- **URL**: `/api/auth/refresh/`
- **Description**: Obtains a new access token using a valid refresh token.
- **Request Body**:
  ```json
  {
      "refresh": "eyJhbGciOi..."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
      "access": "eyJhbGciOi..."
  }
  ```

---

## 2. Challenge APIs

All challenge endpoints are located under `/api/challenges/`. Authentication via JWT is required for most operations.

### 2.1 Get Challenge Details
- **Method**: `GET`
- **URL**: `/api/challenges/challenge/<int:challenge_id>/`
- **Description**: Retrieves the details of a specific coding challenge by its ID.
- **Response (200 OK)**: Returns the `CodingChallenge` object serialized to JSON, including fields like `title`, `description`, `difficulty`, `starter_code`, etc.
- **Error (404 Not Found)**: Returned if the challenge does not exist.

### 2.2 Create Challenge
- **Method**: `POST`
- **URL**: `/api/challenges/challenge/`
- **Description**: Creates a new coding challenge.
- **Request Body**:
  ```json
  {
      "title": "Two Sum",
      "description": "Given an array of integers...",
      "difficulty": "easy",
      "score": 10,
      "starter_code": "def twoSum(nums, target):"
  }
  ```
- **Response (201 Created)**: Returns the created challenge data.

---

## 3. Submission APIs

Code submission and execution endpoints are located under `/api/`. Authentication via JWT is required.

### 3.1 Submit Code
- **Method**: `POST`
- **URL**: `/api/challenge/<int:challenge_id>/submit/`
- **Description**: Submits code for a specific challenge. The code is executed in an isolated Docker container against the challenge's test cases.
- **Request Body**:
  ```json
  {
      "code": "print(int(input()) * 2)"
  }
  ```
- **Response (201 Created)**:
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
              "runtime_ms": 120
          }
      ]
  }
  ```

### 3.2 List User Submissions for Challenge
- **Method**: `GET`
- **URL**: `/api/challenge/<int:challenge_id>/submissions/`
- **Description**: Retrieves a list of past submissions made by the authenticated user for a specific challenge.
- **Response (200 OK)**:
  ```json
  [
      {
          "result_id": 105,
          "submit_status": "AC",
          "passed_testcases": 2,
          "timestamp": "2026-08-11T10:00:00Z"
      }
  ]
  ```

### 3.3 Get Submission Detail
- **Method**: `GET`
- **URL**: `/api/submissions/<int:result_id>/`
- **Description**: Retrieves the full detail of a specific past submission. Users can only view their own submissions.
- **Response (200 OK)**:
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
- **Error (404 Not Found)**: Returned if the submission does not exist or belongs to another user.
