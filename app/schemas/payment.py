from sqlmodel import SQLModel
from uuid import UUID
from decimal import Decimal
from datetime import datetime

class PaymentBase(SQLModel):
    amount: Decimal
    payment_type: str
    status: str

class PaymentCreate(PaymentBase):
    user_id: UUID

class PaymentRead(PaymentBase):
    id: UUID
    user_id: UUID
    transaction_time: datetime
