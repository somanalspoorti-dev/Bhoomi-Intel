import hashlib
import hmac
import base64
from datetime import datetime, timedelta

from jose import jwt


# =========================================================
# JWT SETTINGS
# =========================================================

SECRET_KEY = "bhoomi-intel-secret-key-change-later"
ALGORITHM = "HS256"


# =========================================================
# PASSWORD HASHING
# =========================================================

def hash_password(password: str) -> str:
    """
    Hash password using PBKDF2-HMAC-SHA256.
    No bcrypt/passlib required.
    """

    salt = b"bhoomi-intel-salt"

    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        100000
    )

    return base64.b64encode(password_hash).decode("utf-8")


# Hash for demo officer password: officer123
OFFICER_PASSWORD_HASH = hash_password("officer123")


def verify_password(password: str) -> bool:
    """
    Check entered password against stored hash.
    """

    entered_hash = hash_password(password)

    return hmac.compare_digest(
        entered_hash,
        OFFICER_PASSWORD_HASH
    )


# =========================================================
# JWT TOKEN
# =========================================================

def create_token(username: str):

    expire = datetime.utcnow() + timedelta(hours=2)

    payload = {
        "sub": username,
        "role": "officer",
        "exp": expire
    }

    token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return token