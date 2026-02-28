from sqlmodel import SQLModel, Field
from sqlalchemy import Column, JSON
from typing import Optional, Dict
from uuid import UUID, uuid4
from decimal import Decimal
from datetime import datetime
from enum import Enum

# 1. Enums
class PaymentType(str, Enum):
    TOKEN = "TOKEN"
    SUBSCRIPTION = "SUBSCRIPTION"

class PaymentMethod(str, Enum):
    BKASH = "BKASH"
    NAGAD = "NAGAD"
    UPAY = "UPAY"

class PaymentStatus(str, Enum):
    INITIATED = "INITIATED"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"

# 2. Payment Model
class Payment(SQLModel, table=True):
    __tablename__ = "payment"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    user_id: UUID = Field(foreign_key="user.id", nullable=False)

    amount: Decimal = Field(default=0, max_digits=10, decimal_places=2, nullable=False)

    payment_type: PaymentType = Field(nullable=False)
    payment_method: PaymentMethod = Field(nullable=False)

    reference_id: Optional[str] = Field(default=None)
    # will store subscription_id or token pre-order id

    reference_type: PaymentType = Field(nullable=False)

    status: PaymentStatus = Field(default=PaymentStatus.INITIATED)

    external_txn_id: Optional[str] = Field(default=None)

    currency: str = Field(default="BDT")

    # Using 'payment_metadata' to avoid conflict with SQLModel.metadata
    payment_metadata: Optional[Dict] = Field(
        default=None,
        sa_column=Column("metadata", JSON, nullable=True)
    )

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
