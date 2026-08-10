-- =========================================================
-- Coding Platform - Initial Migration
-- MySQL 8+
-- =========================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS ai_questions;
DROP TABLE IF EXISTS results;
DROP TABLE IF EXISTS test_cases;
DROP TABLE IF EXISTS user_completed_challenges;
DROP TABLE IF EXISTS coding_challenges;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;


-- =========================================================
-- 1. USERS
-- =========================================================

CREATE TABLE users (
    user_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    score INT NOT NULL DEFAULT 0,

    PRIMARY KEY (user_id),
    UNIQUE KEY uk_users_user_name (user_name)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- 2. CODING CHALLENGES
-- =========================================================

CREATE TABLE coding_challenges (
    challenge_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    difficulty ENUM(
        'easy',
        'medium',
        'hard'
    ) NOT NULL DEFAULT 'easy',

    hint TEXT NULL,

    starter_code TEXT NULL,

    score INT NOT NULL DEFAULT 0,

    categories JSON NULL,

    learning_status VARCHAR(50) NULL,

    example_of_correct_code TEXT NULL,

    -- %AC = Acceptance Rate
    acceptance_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,

    PRIMARY KEY (challenge_id),

    INDEX idx_challenges_difficulty (difficulty),
    INDEX idx_challenges_learning_status (learning_status)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- 3. TEST CASES
-- =========================================================

CREATE TABLE test_cases (
    testcase_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    challenge_id BIGINT UNSIGNED NOT NULL,

    input TEXT NOT NULL,
    output TEXT NOT NULL,

    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,

    PRIMARY KEY (testcase_id),

    INDEX idx_test_cases_challenge_id (challenge_id),

    CONSTRAINT fk_test_cases_challenge
        FOREIGN KEY (challenge_id)
        REFERENCES coding_challenges(challenge_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- 4. USER COMPLETED CHALLENGES
-- =========================================================
-- Many-to-Many:
--
-- User
--   1 ----- N user_completed_challenges N ----- 1 Challenge
--
-- Composite Primary Key prevents the same user from
-- completing the same challenge multiple times.
-- =========================================================

CREATE TABLE user_completed_challenges (
    user_id BIGINT UNSIGNED NOT NULL,
    challenge_id BIGINT UNSIGNED NOT NULL,

    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, challenge_id),

    CONSTRAINT fk_completed_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_completed_challenge
        FOREIGN KEY (challenge_id)
        REFERENCES coding_challenges(challenge_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- 5. RESULTS
-- =========================================================

CREATE TABLE results (
    result_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL,
    challenge_id BIGINT UNSIGNED NOT NULL,

    submit TEXT NOT NULL,

    submit_status VARCHAR(50) NOT NULL,

    passed_testcases INT NOT NULL DEFAULT 0,

    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (result_id),

    INDEX idx_results_user_id (user_id),
    INDEX idx_results_challenge_id (challenge_id),
    INDEX idx_results_timestamp (timestamp),

    CONSTRAINT fk_results_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_results_challenge
        FOREIGN KEY (challenge_id)
        REFERENCES coding_challenges(challenge_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- 6. AI QUESTIONS
-- =========================================================

CREATE TABLE ai_questions (
    question_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL,
    challenge_id BIGINT UNSIGNED NOT NULL,

    question TEXT NOT NULL,

    user_answer TEXT NULL,

    feedback TEXT NULL,

    ai_score DECIMAL(5,2) NULL,

    PRIMARY KEY (question_id),

    INDEX idx_ai_questions_user_id (user_id),
    INDEX idx_ai_questions_challenge_id (challenge_id),

    CONSTRAINT fk_ai_questions_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_ai_questions_challenge
        FOREIGN KEY (challenge_id)
        REFERENCES coding_challenges(challenge_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;