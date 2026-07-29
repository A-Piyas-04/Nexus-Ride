# simple tests for password hashing

from app.utils.hashing import hash_password, verify_password


def test_hash_password():
    hashed = hash_password("password123")
    assert hashed != "password123"


def test_verify_password():
    hashed = hash_password("password123")
    assert verify_password("password123", hashed) == True


def test_wrong_password():
    hashed = hash_password("password123")
    assert verify_password("wrong", hashed) == False
