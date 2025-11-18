from decimal import Decimal, ROUND_HALF_UP


CENT = Decimal('0.01')


def price_to_cents(amount: float | Decimal) -> int:
    decimal_value = Decimal(str(amount)).quantize(CENT, rounding=ROUND_HALF_UP)
    return int(decimal_value * 100)


def cents_to_price(value: int) -> float:
    return float(Decimal(value) / 100)
