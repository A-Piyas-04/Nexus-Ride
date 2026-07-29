# simple checks for TO email and password

from app.core.to_credentials import TO_EMAIL, TO_PASSWORD


def test_to_email():
    assert "@iut-dhaka.edu" in TO_EMAIL


def test_to_password():
    assert TO_PASSWORD != ""
