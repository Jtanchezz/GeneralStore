from __future__ import annotations

import json

from fastapi import Depends, Header, HTTPException, status
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import get_settings
from .database import get_session
from .models import User
from .redis_client import get_session_store

settings = get_settings()
SESSION_HEADER = 'X-Session-Token'


def _unauthorized(detail: str = 'Sesión no válida') -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


async def session_token(x_session_token: str | None = Header(default=None)) -> str:
    if not x_session_token:
        raise _unauthorized('Falta el token de sesión')
    return x_session_token


async def get_current_user(
    token: str = Depends(session_token),
    session: AsyncSession = Depends(get_session),
    store=Depends(get_session_store),
) -> User:
    cache_key = f'session:{token}'
    payload = await store.get(cache_key)
    if not payload:
        raise _unauthorized()

    session_data = json.loads(payload)
    user_id = session_data.get('user_id')
    if not user_id:
        raise _unauthorized()

    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError as exc:  # pragma: no cover - guard rail
        raise _unauthorized() from exc

    result = await session.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    if not user:
        raise _unauthorized()

    await store.expire(cache_key, settings.session_ttl_seconds)
    return user


async def get_current_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Solo administradores')
    return user
