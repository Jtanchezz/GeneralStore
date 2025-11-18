from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import get_settings
from .database import init_models
from .redis_client import close_redis
from .routers import auth, cameras, cart, currency, media, offers
from .startup import ensure_admin_user

settings = get_settings()
BASE_DIR = Path(__file__).resolve().parent.parent
MEDIA_ROOT = (BASE_DIR / settings.media_root).resolve()
MEDIA_ROOT.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_models()
    await ensure_admin_user()
    yield
    await close_redis()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173', '*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.mount('/uploads', StaticFiles(directory=str(MEDIA_ROOT)), name='uploads')

app.include_router(auth.router)
app.include_router(cameras.router)
app.include_router(offers.router)
app.include_router(cart.router)
app.include_router(currency.router)
app.include_router(media.router)


@app.get('/')
async def root():
    return {'status': 'ok', 'message': 'Bienvenido a GeneralStore API'}
