from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = 'General Store API'
    environment: str = 'development'
    database_url: str = 'postgresql+asyncpg://postgres:postgres@localhost:5432/general_store'
    session_redis_url: str = 'redis://localhost:6379/0'
    cache_redis_url: str = 'redis://localhost:6379/1'
    session_ttl_seconds: int = 60 * 60 * 24 * 14
    admin_email: str = 'admin@pixelnostalgia.mx'
    admin_password: str = 'change-me-now'
    default_currency: str = 'USD'
    exchange_api_base: str = 'https://api.exchangerate.host'
    media_root: str = 'media'

    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'


@lru_cache
def get_settings() -> Settings:
    return Settings()
