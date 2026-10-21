from dataclasses import dataclass
from decimal import Decimal

from app.core.dinero import redondear
from app.core.excepciones import DatosInvalidosError

UMBRAL_CONFORMIDAD = Decimal("2.00")


@dataclass(frozen=True)
class ResultadoConciliacion:
    """Resultado de la comparación entre stock del sistema y conteo físico (RN-06)."""

    diferencia: int
    porcentaje: Decimal
    conforme: bool


def calcular_porcentaje_diferencia(stock_sistema: int, stock_fisico: int) -> ResultadoConciliacion:
    """Calcula el porcentaje de diferencia entre stock del sistema y conteo físico (RN-06, RN-07).

    - Ambos deben ser enteros >= 0 (RN-08).
    - Si físico = 0 y sistema = 0: 0.00% (conforme).
    - Si físico = 0 y sistema > 0: 100.00% (no conforme).
    - Si físico > 0: % = |sistema - físico| / físico * 100 (redondeado a 2 decimales).
    - Conforme si porcentaje <= 2.00%.
    """
    if not isinstance(stock_sistema, int) or isinstance(stock_sistema, bool) or stock_sistema < 0:
        raise DatosInvalidosError(
            "El stock del sistema debe ser un número entero mayor o igual a 0."
        )

    if not isinstance(stock_fisico, int) or isinstance(stock_fisico, bool) or stock_fisico < 0:
        raise DatosInvalidosError("El stock físico debe ser un número entero mayor o igual a 0.")

    diferencia = stock_sistema - stock_fisico

    if stock_fisico == 0:
        porcentaje = Decimal("0.00") if stock_sistema == 0 else Decimal("100.00")
    else:
        diferencia_dec = Decimal(abs(diferencia))
        fisico_dec = Decimal(stock_fisico)
        porcentaje_crudo = (diferencia_dec / fisico_dec) * Decimal("100")
        porcentaje = redondear(porcentaje_crudo)

    conforme = porcentaje <= UMBRAL_CONFORMIDAD

    return ResultadoConciliacion(
        diferencia=diferencia,
        porcentaje=porcentaje,
        conforme=conforme,
    )
