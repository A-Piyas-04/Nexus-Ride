# simple tests for jwt token

from app.core.security import create_access_token


def test_create_token():
    token = create_access_token({"sub": "123"})
    assert token is not None
    assert type(token) == str


def test_token_not_empty():
    token = create_access_token({"sub": "abc"})
    assert len(token) > 0
