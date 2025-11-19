from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..database import get_session
from ..deps import get_current_user
from ..models import Camera, CameraStatus, CartItem
from ..schemas import AddToCartRequest, CartItemBase, CameraBase

router = APIRouter(prefix='/cart', tags=['carrito'])


@router.get('', response_model=list[CartItemBase])
async def get_cart(user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(CartItem)
        .options(selectinload(CartItem.camera))
        .where(CartItem.user_id == user.id)
        .order_by(CartItem.created_at.desc())
    )
    items = [CartItemBase.model_validate(item) for item in result.scalars().all()]
    return items


@router.post('', response_model=CartItemBase)
async def add_to_cart(
    payload: AddToCartRequest,
    user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    camera = await session.get(Camera, payload.camera_id)
    if not camera:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Cámara no encontrada')
    if camera.status == CameraStatus.sold:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='La cámara ya fue vendida')

    existing = await session.execute(
        select(CartItem.id).where(CartItem.camera_id == payload.camera_id, CartItem.user_id == user.id)
    )
    existing_id = existing.scalar_one_or_none()
    if existing_id:
        loaded = await session.get(CartItem, existing_id, options=[selectinload(CartItem.camera)])
        if loaded:
            return CartItemBase(
                id=loaded.id,
                camera=CameraBase.model_validate(loaded.camera),
                created_at=loaded.created_at,
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='No se pudo cargar el carrito')

    new_item = CartItem(user_id=user.id, camera_id=camera.id)
    session.add(new_item)
    await session.commit()
    await session.refresh(new_item)
    return CartItemBase(
        id=new_item.id,
        camera=CameraBase.model_validate(camera),
        created_at=new_item.created_at,
    )


@router.post('/checkout')
async def checkout_cart(
    user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(CartItem).options(selectinload(CartItem.camera)).where(CartItem.user_id == user.id)
    )
    items = result.scalars().all()
    for item in items:
        if item.camera:
            item.camera.status = CameraStatus.sold
        await session.delete(item)

    await session.commit()
    return {'detail': 'Compra registrada', 'count': len(items)}


@router.delete('/{camera_id}')
async def remove_from_cart(
    camera_id: uuid.UUID,
    user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(CartItem).where(CartItem.camera_id == camera_id, CartItem.user_id == user.id)
    )
    cart_item = result.scalar_one_or_none()
    if not cart_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='No está en tu carrito')

    await session.delete(cart_item)
    await session.commit()
    return {'detail': 'Eliminado del carrito'}
