from sqlmodel import SQLModel, Field
from typing import Optional
from uuid import UUID, uuid4
from decimal import Decimal
from datetime import datetime

class Payment(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id")
    amount: Decimal = Field(default=0, max_digits=10, decimal_places=2)
    payment_type: str # SUBSCRIPTION / TOKEN
    status: str # SUCCESS / FAILED
    transaction_time: datetime = Field(default_factory=datetime.utcnow)
