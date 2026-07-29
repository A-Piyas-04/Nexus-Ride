# simple tests for phone and license validation

from app.api.auth import validate_bd_mobile, validate_license


def test_valid_phone():
    result = validate_bd_mobile("01712345678")
    assert result == "01712345678"


def test_valid_license():
    result = validate_license("DL-1234")
    assert result == "DL-1234"
