"""
config/settings_test.py

Test-only Django settings — overrides the default MySQL database with an
in-memory SQLite instance so the test suite runs without a live DB server.
"""

from .settings import *  # noqa: F401, F403

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Speed up password hashing in tests
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]
