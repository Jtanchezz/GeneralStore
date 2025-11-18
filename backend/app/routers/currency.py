from __future__ import annotations

from fastapi import APIRouter, Query

from ..schemas import CurrencyQuoteResponse
from ..services.exchange import ExchangeService

router = APIRouter(prefix='/currency', tags=['monedas'])
service = ExchangeService()


@router.get('/rates', response_model=CurrencyQuoteResponse)
async def get_rates(base: str = Query(default='USD', min_length=3, max_length=3), symbols: str = 'USD,MXN,EUR'):
    symbol_list = [symbol.strip().upper() for symbol in symbols.split(',') if symbol.strip()]
    quotes = await service.quote(base_currency=base, symbols=symbol_list)
    return CurrencyQuoteResponse(quotes=quotes)
