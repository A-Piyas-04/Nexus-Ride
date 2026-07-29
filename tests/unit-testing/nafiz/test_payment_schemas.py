# simple tests for payment enums and schemas

from decimal import Decimal

from app.models.payment import PaymentType, PaymentMethod, PaymentStatus
from app.schemas.payment import PaymentInitiateRequest, PaymentConfirmRequest


def test_payment_type():
    assert PaymentType.TOKEN.value == "TOKEN"


def test_payment_method():
    assert PaymentMethod.BKASH.value == "BKASH"


def test_payment_status():
    assert PaymentStatus.SUCCESS.value == "SUCCESS"


def test_initiate_request():
    req = PaymentInitiateRequest(
        reference_type=PaymentType.TOKEN,
        reference_id="1",
        payment_method=PaymentMethod.BKASH,
        amount=Decimal("50"),
    )
    assert req.amount == Decimal("50")


def test_confirm_request():
    req = PaymentConfirmRequest(
        external_txn_id="TXN1",
        status=PaymentStatus.SUCCESS,
    )
    assert req.external_txn_id == "TXN1"
