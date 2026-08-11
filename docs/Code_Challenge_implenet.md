Here is a comprehensive, step-by-step implementation plan for building a secure user code execution and testing
service (Judge engine) in Python/Django using Docker containers.
──────

Architecture Overview
                      +-------------------+
                      |   User Submission |
                      +---------+---------+
                                |
                                v
                      +-------------------+
                      | Django API Engine |
                      +---------+---------+
                                |
                   (Task Queue / Worker: Celery)
                                |
                                v
               +----------------------------------+
               |  Isolated Docker Runner Container|
               |                                  |
               |  - Strict Resource Limits (CPU/RAM)|
               |  - Read-Only Mount / Sandbox     |
               |  - Network Disabled (--network=none)|
               |  - Non-root User & Seccomp Profile|
               +----------------+-----------------+
                                |
                        (Return Execution Result)
                                |
                                v
                      +-------------------+
                      | Update DB Result  |
                      | & Return API Resp |
                      +-------------------+
──────
Phase 1: Security & Container Sandbox Setup
Running untrusted user code requires strict isolation to prevent Remote Code Execution (RCE), Denial of Service
(DoS), or system resource exhaustion.

Docker Runner Configuration:
• Network: --network none (Prevents outbound connections or port scans).
• Resource Limits:
• Memory: --memory=256m --memory-swap=256m
• CPU: --cpus=1.0 or --cpu-quota
• Process Limit: --pids-limit=64 (Prevents fork bombs).
• Filesystem: --read-only container with temporary tmpfs mounted for output binaries (--tmpfs /tmp:rw,noexec,
nosuid,size=64m).
• Permissions: --user 1000:1000 (Non-root), drop capabilities --cap-drop=ALL.
Language Base Images:
• Build custom minimal Docker images containing only necessary compilers/runtimes (e.g., gcc/g++ for C/C++,
openjdk for Java, python:alpine for Python).
──────

Phase 2: Execution Engine Module (Django Core)
Create a dedicated execution module in Django (e.g., core/judge/runner.py).

Submission Pipeline Steps:
• Write Source Code: Save user submitted code into a temporary workspace directory on the host server.
• Compile Stage (if compiled language like C++/Java):
• Run container command: g++ -O2 solution.cpp -o solution
• Capture compilation errors (stderr). If compilation fails → Status: Compilation Error (CE).
• Execution Stage:
• Loop through TestCase instances linked to the CodingChallenge.
• Pipe testcase.input into stdin of the container runner.
• Enforce hard time limits (e.g., 2.0 seconds per test case using python timeout / container timeout).
• Comparison & Verification:
• Standardize output by trimming trailing whitespaces and line endings.
• Compare actual output vs testcase.output.
• Output mismatch → Status: Wrong Answer (WA).
• Exceeds time limit → Status: Time Limit Exceeded (TLE).
• Non-zero exit code / crash → Status: Runtime Error (RE).
• All passed → Status: Accepted (AC).
──────

Phase 3: Task Queue & Async Execution Architecture
To keep Django API endpoints fast and prevent request blocking during long executions:

Celery Task Queue:
• Dispatch code submissions to a background worker queue (Redis / RabbitMQ + Celery).
Result Polling or WebSockets:
• Return a submission_id immediately to the frontend.
• Frontend polls /api/submissions//status or connects via WebSocket (Django Channels) to receive live status
updates.
──────

Phase 4: Database Schema & API Integration
Database Sync (models.py):
• Update Result model record with:
• submit_status (AC, WA, TLE, RE, CE)
• passed_testcases count out of total test cases.
• Execution metrics (optional): runtime_ms, memory_used_kb.
• If status is AC and first time passing, update UserCompletedChallenge and increment user score in User.
API Endpoint:
• Create POST /api/challenge//submit/ accepting language and code.
──────

Recommended Implementation Milestones
Milestone 1: Write Docker runner service using python docker SDK or subprocess to execute Python / C++ code in
isolated containers with limits.
Milestone 2: Build TestCase evaluator logic (input piping & output comparison).
Milestone 3: Connect Django views/serializers for submission and test case verification.
Milestone 4: Integrate Celery for asynchronous background code execution.
Let me know if you would like me to start implementing any specific phase (e.g., the Docker sandbox execution script
or Celery integration)!



In this Project, we use Python runner only