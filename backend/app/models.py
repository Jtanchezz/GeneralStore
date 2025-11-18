from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.types import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class CameraStatus(str, enum.Enum):
    available = 'available'
    reserved = 'reserved'
    sold = 'sold'


class OfferStatus(str, enum.Enum):
    pending = 'pending'
    accepted = 'accepted'
    declined = 'declined'
    countered = 'countered'


class User(Base):
    __tablename__ = 'users'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_admin: Mapped[bool] = mapped_column(default=False)
    preferred_currency: Mapped[str] = mapped_column(String(3), default='USD')
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    cart_items: Mapped[list['CartItem']] = relationship(back_populates='user', cascade='all, delete')
    offers: Mapped[list['Offer']] = relationship(back_populates='user', cascade='all, delete')


class Camera(Base):
    __tablename__ = 'cameras'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(160))
    brand: Mapped[str] = mapped_column(String(80))
    description: Mapped[str] = mapped_column(Text)
    price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default='USD')
    condition: Mapped[str] = mapped_column(String(80))
    status: Mapped[CameraStatus] = mapped_column(Enum(CameraStatus), default=CameraStatus.available)
    image_path: Mapped[str | None] = mapped_column(String(255))
    image_gallery: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )
    sold_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    cart_items: Mapped[list['CartItem']] = relationship(back_populates='camera')

    __table_args__ = (
        CheckConstraint('price_cents >= 0', name='camera_price_positive'),
    )


class Offer(Base):
    __tablename__ = 'offers'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'))
    camera_title: Mapped[str] = mapped_column(String(160))
    brand: Mapped[str] = mapped_column(String(80))
    condition: Mapped[str] = mapped_column(String(80))
    asking_price_cents: Mapped[int] = mapped_column(Integer)
    preferred_currency: Mapped[str] = mapped_column(String(3), default='USD')
    notes: Mapped[str | None] = mapped_column(Text())
    image_gallery: Mapped[list[str]] = mapped_column(JSON, default=list)
    status: Mapped[OfferStatus] = mapped_column(Enum(OfferStatus), default=OfferStatus.pending)
    counter_offer_cents: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user: Mapped['User'] = relationship(back_populates='offers')


class CartItem(Base):
    __tablename__ = 'cart_items'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'))
    camera_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey('cameras.id', ondelete='CASCADE'), unique=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    user: Mapped['User'] = relationship(back_populates='cart_items')
    camera: Mapped['Camera'] = relationship(back_populates='cart_items')

    __table_args__ = (
        UniqueConstraint('user_id', 'camera_id', name='user_camera_unique'),
    )
