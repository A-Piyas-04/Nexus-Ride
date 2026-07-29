# simple tests for signup and login schemas

from app.schemas.auth import SignupRequest, LoginRequest, normalize_iut_email


def test_normalize_email():
    result = normalize_iut_email("Test@IUT-Dhaka.edu")
    assert result == "test@iut-dhaka.edu"


def test_signup_request():
    data = SignupRequest(
        email="user@iut-dhaka.edu",
        password="password123",
        full_name="Test User",
    )
    assert data.email == "user@iut-dhaka.edu"
    assert data.full_name == "Test User"


def test_login_request():
    data = LoginRequest(
        email="user@iut-dhaka.edu",
        password="password123",
    )
    assert data.email == "user@iut-dhaka.edu"
