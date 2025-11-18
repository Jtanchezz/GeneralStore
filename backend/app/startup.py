from __future__ import annotations

from sqlalchemy import select

from .config import get_settings
from .database import async_session_factory
from .models import User
from .utils.security import get_password_hash

settings = get_settings()


async def ensure_admin_user() -> None:
    async with async_session_factory() as session:
        result = await session.execute(select(User).where(User.email == settings.admin_email.lower()))
        admin = result.scalar_one_or_none()
        hashed_password = get_password_hash(settings.admin_password)
        if admin:
            admin.hashed_password = hashed_password
            admin.is_admin = True
            admin.preferred_currency = settings.default_currency.upper()
        else:
            admin = User(
                name='Administrador GeneralStore',
                email=settings.admin_email.lower(),
                hashed_password=hashed_password,
                is_admin=True,
                preferred_currency=settings.default_currency.upper(),
            )
            session.add(admin)
        await session.commit()
