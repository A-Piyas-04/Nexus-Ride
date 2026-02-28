from sqlmodel import SQLModel
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field

from app.models.payment import PaymentType, PaymentMethod, PaymentStatus

# Request Models
class PaymentInitiateRequest(BaseModel):
    reference_type: PaymentType
    reference_id: str
    payment_method: PaymentMethod
    amount: Optional[Decimal] = None # Optional for now, but should ideally be computed backend side

class PaymentConfirmRequest(BaseModel):
    external_txn_id: str
    status: PaymentStatus

# Response Models
class PaymentRead(SQLModel):
    id: UUID
    user_id: UUID
    amount: Decimal
    payment_type: PaymentType
    payment_method: PaymentMethod
    reference_id: Optional[str]
    reference_type: PaymentType
    status: PaymentStatus
    external_txn_id: Optional[str]
    currency: str
    payment_metadata: Optional[Dict]
    created_at: datetime
    updated_at: datetime
    
    # Optional mock URL for frontend
    payment_url: Optional[str] = None
