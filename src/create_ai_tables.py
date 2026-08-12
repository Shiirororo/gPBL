import os
import sys
import django

# src/ is the Django root; project root (containing 'core') is one level up
SRC_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SRC_DIR)
sys.path.insert(0, SRC_DIR)
sys.path.insert(0, PROJECT_ROOT)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.db import connection

DDL = """
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS ai_exchanges;
DROP TABLE IF EXISTS ai_conversations;

CREATE TABLE ai_conversations (
    conversation_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id         BIGINT UNSIGNED NOT NULL,
    challenge_id    BIGINT UNSIGNED NOT NULL,
    status          VARCHAR(10)     NOT NULL DEFAULT 'active',
    current_code    LONGTEXT        NOT NULL,
    revision        BIGINT UNSIGNED NOT NULL DEFAULT 0,
    started_at      DATETIME(6)     NOT NULL,
    updated_at      DATETIME(6)     NOT NULL,
    ended_at        DATETIME(6)     NULL,
    PRIMARY KEY (conversation_id),
    INDEX idx_aiconv_user_chal_upd (user_id, challenge_id, updated_at),
    INDEX idx_aiconv_user_stat_upd (user_id, status, updated_at),
    CONSTRAINT fk_aiconv_user
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_aiconv_challenge
        FOREIGN KEY (challenge_id) REFERENCES coding_challenges(challenge_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ai_exchanges (
    exchange_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    conversation_id  BIGINT UNSIGNED NOT NULL,
    sequence         BIGINT UNSIGNED NOT NULL,
    user_question    LONGTEXT        NOT NULL,
    code_snapshot    LONGTEXT        NOT NULL,
    assistant_hint   LONGTEXT        NOT NULL,
    created_at       DATETIME(6)     NOT NULL,
    request_id       CHAR(32)        NOT NULL,
    status           VARCHAR(10)     NOT NULL DEFAULT 'pending',
    PRIMARY KEY (exchange_id),
    UNIQUE KEY uq_aiexchange_request_id (request_id),
    UNIQUE KEY uq_aiexchange_conv_sequence (conversation_id, sequence),
    CONSTRAINT ck_aiexchange_sequence_gt_0 CHECK (sequence > 0),
    CONSTRAINT fk_aiexchange_conversation
        FOREIGN KEY (conversation_id) REFERENCES ai_conversations(conversation_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
"""

with connection.cursor() as cursor:
    for statement in DDL.strip().split(";"):
        stmt = statement.strip()
        if stmt:
            print(f"Executing: {stmt[:60]}...")
            cursor.execute(stmt)

print("\n✅ Tables created successfully.")
print("Now faking migration 0002 so Django tracks it as applied...")
