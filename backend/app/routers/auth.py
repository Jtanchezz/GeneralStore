from __future__ import annotations

import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..database import get_session
from ..deps import get_current_user, session_token
from ..models import User
from ..redis_client import get_session_store
from ..schemas import SessionResponse, UserBase, UserCreate, UserLogin
from ..utils.security import generate_session_token, get_password_hash, verify_password

router = APIRouter(prefix='/auth', tags=['auth'])
settings = get_settings()


@router.post('/register', response_model=UserBase)
async def register_user(payload: UserCreate, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='El correo ya existe')

    user = User(
        name=payload.name,
        email=payload.email.lower(),
        hashed_password=get_password_hash(payload.password),
        preferred_currency=settings.default_currency.upper(),
        is_admin=False,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@router.post('/login', response_model=SessionResponse)
async def login_user(
    payload: UserLogin,
    session: AsyncSession = Depends(get_session),
    store=Depends(get_session_store),
):
    result = await session.execute(select(User).where(User.email == payload.email.lower()))
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Credenciales inválidas')

    token = generate_session_token()
    cache_key = f'session:{token}'
    session_payload = json.dumps({'user_id': str(user.id)})
    await store.set(cache_key, session_payload, ex=settings.session_ttl_seconds)

    return SessionResponse(token=token, user=user, expires_in_seconds=settings.session_ttl_seconds)


@router.post('/logout')
async def logout_user(token: str = Depends(session_token), store=Depends(get_session_store)):
    await store.delete(f'session:{token}')
    return {'detail': 'Sesión cerrada'}


@router.get('/me', response_model=UserBase)
async def read_current_user(user=Depends(get_current_user)):
    return user
