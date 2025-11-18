from __future__ import annotations

import json
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..deps import get_current_admin
from ..models import Camera, CameraStatus, CartItem
from ..redis_client import cache_store
from ..schemas import CameraBase, CameraCreate, CameraListResponse, CameraUpdate
from ..utils.money import price_to_cents

router = APIRouter(prefix='/cameras', tags=['camaras'])


async def _invalidate_camera_cache() -> None:
    await cache_store().delete('cameras:all')


@router.get('', response_model=CameraListResponse)
async def list_cameras(session: AsyncSession = Depends(get_session)):
    cache_key = 'cameras:all'
    cache = cache_store()
    cached = await cache.get(cache_key)
    if cached:
        try:
            payload = json.loads(cached)
            cameras = [CameraBase(**item) for item in payload]
            return CameraListResponse(items=cameras)
        except (json.JSONDecodeError, TypeError):
            await cache.delete(cache_key)

    result = await session.execute(select(Camera).order_by(Camera.created_at.desc()))
    cameras = result.scalars().all()
    items = []
    for camera in cameras:
        data = CameraBase.model_validate(camera).model_dump(mode='json')
        # fuerza el precio calculado desde cents para evitar serializaciones en cero
        data['price'] = camera.price_cents / 100
        items.append(data)
    await cache.set(cache_key, json.dumps(items, default=str), ex=300)
    return CameraListResponse(items=[CameraBase(**item) for item in items])


@router.get('/{camera_id}', response_model=CameraBase)
async def get_camera(camera_id: uuid.UUID, session: AsyncSession = Depends(get_session)):
    camera = await session.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Cámara no encontrada')
    return camera


@router.post('', response_model=CameraBase)
async def create_camera(
    payload: CameraCreate,
    admin=Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    _ = admin
    camera = Camera(
        title=payload.title,
        brand=payload.brand,
        description=payload.description,
        condition=payload.condition,
        price_cents=price_to_cents(payload.price),
        currency=payload.currency.upper(),
        image_path=payload.image_path,
        image_gallery=payload.image_gallery or [],
    )
    session.add(camera)
    await session.commit()
    await session.refresh(camera)
    await _invalidate_camera_cache()
    return camera


@router.patch('/{camera_id}', response_model=CameraBase)
async def update_camera(
    camera_id: uuid.UUID,
    payload: CameraUpdate,
    admin=Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    _ = admin
    camera = await session.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Cámara no encontrada')

    update_data = payload.model_dump(exclude_unset=True)
    if 'price' in update_data:
        camera.price_cents = price_to_cents(update_data.pop('price'))
    for attr, value in update_data.items():
        if attr == 'status' and value == CameraStatus.sold:
            camera.sold_at = camera.sold_at or datetime.utcnow()
        setattr(camera, attr, value)

    await session.commit()
    await session.refresh(camera)
    await _invalidate_camera_cache()
    return camera


@router.delete('/{camera_id}')
async def delete_camera(
    camera_id: uuid.UUID,
    admin=Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    _ = admin
    camera = await session.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Cámara no encontrada')

    # limpiar relaciones dependientes (p. ej., items de carrito) para evitar violaciones al eliminar
    await session.execute(delete(CartItem).where(CartItem.camera_id == camera_id))

    await session.delete(camera)
    await session.commit()
    await _invalidate_camera_cache()
    return {'detail': 'Cámara eliminada'}
