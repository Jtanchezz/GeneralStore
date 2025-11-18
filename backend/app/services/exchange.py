from __future__ import annotations

import json
from datetime import datetime
from typing import Sequence

import httpx

from ..config import get_settings
from ..redis_client import cache_store

settings = get_settings()


class ExchangeService:
    def __init__(self, base_url: str | None = None) -> None:
        self.base_url = (base_url or settings.exchange_api_base).rstrip('/')

    async def fetch_rates(self, base_currency: str, symbols: Sequence[str]) -> dict[str, float]:
        normalized_base = base_currency.upper()
        normalized_symbols = sorted({code.upper() for code in symbols if code})
        symbol_string = ','.join(normalized_symbols)
        cache_key = f"exchange:{normalized_base}:{symbol_string or 'ALL'}"
        store = cache_store()

        cached = await store.get(cache_key)
        if cached:
            return json.loads(cached)

        params = {'base': normalized_base}
        if symbol_string:
            params['symbols'] = symbol_string

        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f'{self.base_url}/latest', params=params)
            response.raise_for_status()
            payload = response.json()

        rates = payload.get('rates', {})
        await store.set(cache_key, json.dumps(rates), ex=1800)
        return rates

    async def quote(self, base_currency: str, symbols: Sequence[str]) -> list[dict[str, str | float | datetime]]:
        rates = await self.fetch_rates(base_currency, symbols)
        now = datetime.utcnow()
        return [
            {
                'base_currency': base_currency.upper(),
                'quote_currency': currency,
                'rate': rate,
                'updated_at': now,
            }
            for currency, rate in rates.items()
        ]
