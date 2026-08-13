-- =========================================================
-- AI Lock Feature Migration
-- =========================================================

CREATE TABLE feature_locks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    feature VARCHAR(100) NOT NULL,
    locked_until DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_user_feature (user_id, feature),
    INDEX idx_feature_locks_user_id (user_id),
    INDEX idx_feature_locks_locked_until (locked_until),

    CONSTRAINT fk_feature_locks_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- Challenge Sessions Table
-- =========================================================

CREATE TABLE challenge_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    challenge_id BIGINT UNSIGNED NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    status ENUM('active', 'completed', 'abandoned') DEFAULT 'active',

    UNIQUE KEY uk_user_challenge_session (user_id, challenge_id),
    INDEX idx_challenge_sessions_user_id (user_id),
    INDEX idx_challenge_sessions_challenge_id (challenge_id),
    INDEX idx_challenge_sessions_status (status),

    CONSTRAINT fk_challenge_sessions_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_challenge_sessions_challenge
        FOREIGN KEY (challenge_id)
        REFERENCES coding_challenges(challenge_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci;