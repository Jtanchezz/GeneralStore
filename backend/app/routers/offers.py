from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..deps import get_current_admin, get_current_user
from ..models import Offer, OfferStatus
from ..schemas import OfferAction, OfferBase, OfferCreate, OfferListResponse
from ..utils.money import price_to_cents

router = APIRouter(prefix='/offers', tags=['ofertas'])


@router.post('', response_model=OfferBase)
async def submit_offer(
    payload: OfferCreate,
    user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if len(payload.image_gallery or []) < 3:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Debes subir al menos 3 fotos de la cámara')
    offer = Offer(
        user_id=user.id,
        camera_title=payload.camera_title,
        brand=payload.brand,
        condition=payload.condition,
        asking_price_cents=price_to_cents(payload.asking_price),
        preferred_currency=payload.preferred_currency.upper(),
        notes=payload.notes,
        image_gallery=payload.image_gallery or [],
    )
    session.add(offer)
    await session.commit()
    await session.refresh(offer)
    return offer


@router.get('/me', response_model=OfferListResponse)
async def my_offers(user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Offer).where(Offer.user_id == user.id).order_by(Offer.created_at.desc()))
    items = [OfferBase.model_validate(offer) for offer in result.scalars().all()]
    return OfferListResponse(items=items)


@router.get('/admin', response_model=OfferListResponse)
async def get_all_offers(admin=Depends(get_current_admin), session: AsyncSession = Depends(get_session)):
    _ = admin
    result = await session.execute(select(Offer).order_by(Offer.created_at.desc()))
    items = [OfferBase.model_validate(offer) for offer in result.scalars().all()]
    return OfferListResponse(items=items)


@router.post('/{offer_id}/decision', response_model=OfferBase)
async def decide_offer(
    offer_id: uuid.UUID,
    payload: OfferAction,
    user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    offer = await session.get(Offer, offer_id)
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Oferta no encontrada')

    # Permitir solo admin o dueño de la oferta
    if not user.is_admin and offer.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='No autorizado')

    offer.status = payload.action
    if payload.action == OfferStatus.countered and payload.counter_amount is not None:
        offer.counter_offer_cents = price_to_cents(payload.counter_amount)
    elif payload.action != OfferStatus.countered:
        offer.counter_offer_cents = None

    await session.commit()
    await session.refresh(offer)
    return offer
