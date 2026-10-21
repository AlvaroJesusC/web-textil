from dataclasses import dataclass
from decimal import Decimal

from app.core.dinero import redondear
from app.core.excepciones import DatosInvalidosError, DescuentoNoPermitidoError

TASA_IGV = Decimal("0.18")


@dataclass(frozen=True)
class ItemVenta:
    """Ítem individual para el cálculo de venta."""

    cantidad: int
    precio_unitario: Decimal


@dataclass(frozen=True)
class ResumenVenta:
    """Resumen final del cálculo de una venta (RF-21, RN-01, RN-02)."""

    subtotal: Decimal
    descuento: Decimal
    base_imponible: Decimal
    igv: Decimal
    total: Decimal


def calcular_total_venta(
    items: list[ItemVenta],
    descuento_pct: Decimal = Decimal("0"),
    tope_descuento_pct: Decimal = Decimal("100"),
) -> ResumenVenta:
    """Calcula subtotal, descuento, base, IGV (18%) y total (RN-02).

    Orden:
    1. Validar ítems y montos (RN-04)
    2. Validar rango de descuento [0, 100] y tope por rol (RN-03)
    3. subtotal = Σ(cantidad × precio_unitario)
    4. descuento = redondear(subtotal × descuento_pct / 100)
    5. base = subtotal − descuento
    6. igv = redondear(base × 0.18)
    7. total = base + igv
    """
    if not items:
        raise DatosInvalidosError("La venta debe contener al menos un producto (ítem).")

    if not isinstance(descuento_pct, Decimal):
        try:
            descuento_pct = Decimal(str(descuento_pct))
        except Exception as err:
            raise DatosInvalidosError(
                "El porcentaje de descuento debe ser un valor numérico."
            ) from err

    if not isinstance(tope_descuento_pct, Decimal):
        try:
            tope_descuento_pct = Decimal(str(tope_descuento_pct))
        except Exception as err:
            raise DatosInvalidosError("El tope de descuento debe ser un valor numérico.") from err

    if descuento_pct < Decimal("0") or descuento_pct > Decimal("100"):
        raise DatosInvalidosError(
            f"El porcentaje de descuento debe estar entre 0% y 100% (recibido: {descuento_pct}%)."
        )

    if descuento_pct > tope_descuento_pct:
        raise DescuentoNoPermitidoError(
            porcentaje=descuento_pct,
            maximo_permitido=tope_descuento_pct,
        )

    subtotal_acumulado = Decimal("0.00")
    for item in items:
        if (
            not isinstance(item.cantidad, int)
            or isinstance(item.cantidad, bool)
            or item.cantidad <= 0
        ):
            raise DatosInvalidosError(
                "La cantidad de cada producto debe ser un número entero mayor a 0."
            )

        if not isinstance(item.precio_unitario, Decimal):
            try:
                precio_dec = Decimal(str(item.precio_unitario))
            except Exception as err:
                raise DatosInvalidosError(
                    "El precio unitario debe ser un valor numérico válido."
                ) from err
        else:
            precio_dec = item.precio_unitario

        if precio_dec <= Decimal("0"):
            raise DatosInvalidosError("El precio unitario de cada producto debe ser mayor a 0.")

        subtotal_acumulado += Decimal(item.cantidad) * precio_dec

    subtotal = redondear(subtotal_acumulado)
    monto_descuento = redondear(subtotal * (descuento_pct / Decimal("100")))
    base_imponible = redondear(subtotal - monto_descuento)
    monto_igv = redondear(base_imponible * TASA_IGV)
    total = redondear(base_imponible + monto_igv)

    return ResumenVenta(
        subtotal=subtotal,
        descuento=monto_descuento,
        base_imponible=base_imponible,
        igv=monto_igv,
        total=total,
    )
