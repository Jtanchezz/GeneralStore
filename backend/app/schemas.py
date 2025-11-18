from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, FieldValidationInfo, field_validator, model_validator

from .models import CameraStatus, OfferStatus


class UserBase(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    is_admin: bool
    preferred_currency: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class SessionResponse(BaseModel):
    token: str
    user: UserBase
    expires_in_seconds: int


class CameraBase(BaseModel):
    id: UUID
    title: str
    brand: str
    description: str
    condition: str
    price_cents: int
    price: float = 0
    currency: str
    status: CameraStatus
    image_path: str | None
    image_gallery: list[str] = []
    created_at: datetime
    updated_at: datetime
    sold_at: datetime | None

    @model_validator(mode='before')
    @classmethod
    def compute_price(cls, values):
        if isinstance(values, dict) and 'price_cents' in values:
            values.setdefault('price', values['price_cents'] / 100)
        return values

    class Config:
        from_attributes = True


class CameraCreate(BaseModel):
    title: str
    brand: str
    description: str
    condition: str
    price: float = Field(gt=0)
    currency: str = Field(default='USD', min_length=3, max_length=3)
    image_path: str | None = None
    image_gallery: list[str] = Field(default_factory=list)


class CameraUpdate(BaseModel):
    title: str | None = None
    brand: str | None = None
    description: str | None = None
    condition: str | None = None
    price: float | None = Field(default=None, gt=0)
    status: CameraStatus | None = None
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    image_path: str | None = None
    image_gallery: list[str] | None = None


class CameraListResponse(BaseModel):
    items: list[CameraBase]


class OfferBase(BaseModel):
    id: UUID
    camera_title: str
    brand: str
    condition: str
    asking_price_cents: int
    preferred_currency: str
    notes: str | None
    image_gallery: list[str] = []
    status: OfferStatus
    counter_offer_cents: int | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OfferCreate(BaseModel):
    camera_title: str
    brand: str
    condition: str
    asking_price: float = Field(gt=0)
    preferred_currency: str = Field(default='USD', min_length=3, max_length=3)
    notes: str = Field(min_length=1, max_length=500)
    image_gallery: list[str] = Field(default_factory=list)


class OfferAction(BaseModel):
    action: OfferStatus
    counter_amount: float | None = Field(default=None, gt=0)

    @field_validator('action')
    @classmethod
    def ensure_admin_actions(cls, value: OfferStatus) -> OfferStatus:
        if value not in {OfferStatus.accepted, OfferStatus.declined, OfferStatus.countered}:
            raise ValueError('action must be accepted, declined or countered')
        return value

    @field_validator('counter_amount')
    @classmethod
    def validate_counter(cls, value: float | None, info: FieldValidationInfo):
        action = info.data.get('action') if info.data else None
        if action == OfferStatus.countered and value is None:
            raise ValueError('counter_amount is required for countered action')
        return value


class OfferListResponse(BaseModel):
    items: list[OfferBase]


class CartItemBase(BaseModel):
    id: UUID
    camera: CameraBase
    created_at: datetime

    class Config:
        from_attributes = True


class AddToCartRequest(BaseModel):
    camera_id: UUID


class CurrencyQuote(BaseModel):
    base_currency: str
    quote_currency: str
    rate: float
    updated_at: datetime


class CurrencyQuoteResponse(BaseModel):
    quotes: list[CurrencyQuote]
