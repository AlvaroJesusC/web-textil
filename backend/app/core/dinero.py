from decimal import ROUND_HALF_UP, Decimal

DOS_DECIMALES = Decimal("0.01")


def redondear(valor: Decimal | int | str) -> Decimal:
    """Redondea un monto a 2 decimales usando ROUND_HALF_UP (RN-01).

    Nunca usa float para evitar errores de precisión binaria.
    """
    if not isinstance(valor, Decimal):
        valor = Decimal(str(valor))
    return valor.quantize(DOS_DECIMALES, rounding=ROUND_HALF_UP)
