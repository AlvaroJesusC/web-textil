from dataclasses import dataclass
from decimal import Decimal

from app.core.excepciones import DatosInvalidosError, StockInsuficienteError
from app.inventario.models import EstadoStock


@dataclass(frozen=True)
class DatosProducto:
    """Datos para validación pura de producto (RF-07, RN-09)."""

    sku: str
    nombre: str
    precio: Decimal
    stock: int
    stock_minimo: int = 0


def validar_producto(datos: DatosProducto) -> dict[str, str]:
    """Valida los campos obligatorios y rangos de un producto (RN-09).

    Devuelve un diccionario con {campo: mensaje} para TODOS los errores encontrados.
    Un diccionario vacío {} indica que todos los campos son válidos.
    La unicidad del SKU se valida en el servicio (requiere BD).
    """
    errores: dict[str, str] = {}

    if not datos.sku or not datos.sku.strip():
        errores["sku"] = "El código SKU es obligatorio."

    if not datos.nombre or not datos.nombre.strip():
        errores["nombre"] = "El nombre es obligatorio."

    if not isinstance(datos.precio, Decimal):
        try:
            precio_dec = Decimal(str(datos.precio))
        except Exception:
            precio_dec = Decimal("-1")
    else:
        precio_dec = datos.precio

    if precio_dec <= Decimal("0"):
        errores["precio"] = "El precio debe ser mayor a 0."

    if not isinstance(datos.stock, int) or isinstance(datos.stock, bool) or datos.stock < 0:
        errores["stock"] = "El stock no puede ser negativo."

    if (
        not isinstance(datos.stock_minimo, int)
        or isinstance(datos.stock_minimo, bool)
        or datos.stock_minimo < 0
    ):
        errores["stock_minimo"] = "El stock mínimo no puede ser negativo."

    return errores


def estado_stock(stock: int, stock_minimo: int, activo: bool = True) -> EstadoStock:
    """Calcula el estado del stock según reglas del negocio (RN-10).

    Prioridad:
    1. Si está inactivo -> inactivo
    2. Si stock == 0 -> agotado
    3. Si stock <= stock_minimo -> bajo
    4. De lo contrario -> normal
    """
    if not activo:
        return EstadoStock.INACTIVO
    if stock <= 0:
        return EstadoStock.AGOTADO
    if stock <= stock_minimo:
        return EstadoStock.BAJO
    return EstadoStock.NORMAL


def descontar_stock(
    stock_actual: int,
    cantidad: int,
    producto_nombre: str = "Producto",
    sku: str | None = None,
) -> int:
    """Aplica la regla de deducción de stock (RF-19, RF-23, RN-05).

    - La cantidad debe ser un entero > 0.
    - No permite ventas mayores al stock actual (nunca queda negativo).
    - Devuelve el nuevo stock resultante.
    """
    if not isinstance(cantidad, int) or isinstance(cantidad, bool) or cantidad <= 0:
        raise DatosInvalidosError("La cantidad a descontar debe ser un número entero mayor a 0.")

    if not isinstance(stock_actual, int) or isinstance(stock_actual, bool) or stock_actual < 0:
        raise DatosInvalidosError("El stock actual debe ser un número entero no negativo.")

    if cantidad > stock_actual:
        raise StockInsuficienteError(
            producto_nombre=producto_nombre,
            disponible=stock_actual,
            solicitado=cantidad,
            sku=sku,
        )

    return stock_actual - cantidad
