# Catálogo mínimo de casos · Fase 1

Contratos y casos obligatorios de las 4 funciones críticas. Los valores esperados están calculados a mano
según las reglas RN de [01-requerimientos.md](../../../../docs/01-requerimientos.md).
IDs con el formato `CP-<función>-<caso>`.

---

## Función 1 · `validar_producto` (RF-07 · RN-09) y `estado_stock` (RN-10)

**Archivo:** `app/inventario/reglas.py`

```python
@dataclass(frozen=True)
class DatosProducto:
    sku: str
    nombre: str
    precio: Decimal
    stock: int
    stock_minimo: int = 0

def validar_producto(datos: DatosProducto) -> dict[str, str]:
    """Devuelve {campo: mensaje} con TODOS los errores. Diccionario vacío = válido.
    La unicidad del SKU NO se valida aquí (requiere BD): la hace el servicio."""

def estado_stock(stock: int, stock_minimo: int, activo: bool = True) -> EstadoStock:
    """EstadoStock es un StrEnum: normal | bajo | agotado | inactivo."""
```

| ID | Técnica | Entrada | Esperado |
| --- | --- | --- | --- |
| CP-01-01 | Partición válida | `sku="TEL-001", nombre="Tela jersey algodón", precio=12.50, stock=40, stock_minimo=5` | `{}` |
| CP-01-02 | Partición inválida | `nombre=""` | clave `nombre` |
| CP-01-03 | Partición inválida | `nombre="   "` (solo espacios) | clave `nombre` |
| CP-01-04 | Partición inválida | `sku=""` | clave `sku` |
| CP-01-05 | Valor límite | `precio=0` | clave `precio` |
| CP-01-06 | Valor límite | `precio=0.01` | `{}` |
| CP-01-07 | Partición inválida | `precio=-5.00` | clave `precio` |
| CP-01-08 | Valor límite | `stock=0` | `{}` |
| CP-01-09 | Valor límite | `stock=-1` | clave `stock` |
| CP-01-10 | Partición inválida | `stock_minimo=-1` | clave `stock_minimo` |
| CP-01-11 | Múltiples errores | `nombre="", precio=0, stock=-1` | claves `nombre`, `precio` y `stock` (las 3) |
| CP-01-12 | estado_stock | `stock=0, minimo=5, activo=True` | `agotado` |
| CP-01-13 | estado_stock · límite | `stock=5, minimo=5` | `bajo` |
| CP-01-14 | estado_stock · límite | `stock=6, minimo=5` | `normal` |
| CP-01-15 | estado_stock | `stock=10, minimo=5, activo=False` | `inactivo` (tiene prioridad) |

Mensajes sugeridos: "El nombre es obligatorio", "El precio debe ser mayor a 0", "El stock no puede ser negativo".

---

## Función 2 · `calcular_total_venta` (RF-20, RF-21 · RNF-03 · RN-01 a RN-04)

**Archivo:** `app/ventas/reglas.py`

```python
IGV = Decimal("0.18")

@dataclass(frozen=True)
class ItemVenta:
    cantidad: int
    precio_unitario: Decimal

@dataclass(frozen=True)
class ResumenVenta:
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
    """Orden: subtotal → descuento (redondeado) → base → IGV (redondeado sobre la base) → total = base + IGV.
    Todos los montos con 2 decimales y ROUND_HALF_UP.
    Errores: DatosInvalidosError (sin ítems, cantidad/precio inválidos, % fuera de 0..100);
             DescuentoNoPermitidoError (% > tope del usuario)."""
```

| ID | Técnica | Entrada | Esperado |
| --- | --- | --- | --- |
| CP-02-01 | Partición válida | `[2 × 10.00]`, desc 0 | subtotal 20.00 · desc 0.00 · base 20.00 · IGV 3.60 · total **23.60** |
| CP-02-02 | Exactitud (varios ítems) | `[3 × 12.50, 2 × 4.90]`, desc 10 | subtotal 47.30 · desc 4.73 · base 42.57 · IGV 7.66 · total **50.23** |
| CP-02-03 | Redondeo IGV HALF_UP | `[1 × 0.25]`, desc 0 | IGV 0.045 → **0.05** · total **0.30** (con HALF_EVEN saldría 0.04) |
| CP-02-04 | Redondeo descuento HALF_UP | `[1 × 0.50]`, desc 1 | desc 0.005 → **0.01** · base 0.49 · IGV 0.09 · total **0.58** |
| CP-02-05 | Exactitud con descuento | `[1 × 33.35]`, desc 15, tope 100 | desc 5.00 · base 28.35 · IGV 5.10 · total **33.45** |
| CP-02-06 | Valor límite | desc 100 | total **0.00** |
| CP-02-07 | Valor límite (tope) | desc 10, tope 10 | se acepta |
| CP-02-08 | Valor límite (tope) | desc 10.01, tope 10 | `DescuentoNoPermitidoError` |
| CP-02-09 | Partición inválida | desc -1 | `DatosInvalidosError` |
| CP-02-10 | Partición inválida | desc 100.01 | `DatosInvalidosError` |
| CP-02-11 | Partición inválida | `items=[]` | `DatosInvalidosError` |
| CP-02-12 | Partición inválida | cantidad 0 / -1 (parametrizado) | `DatosInvalidosError` |
| CP-02-13 | Partición inválida | precio 0 / -1.00 (parametrizado) | `DatosInvalidosError` |
| CP-02-14 | Tipo de resultado | cualquiera válido | todos los montos son `Decimal` con exponente `-2` |

---

## Función 3 · `descontar_stock` (RF-19, RF-23 · RN-05)

**Archivo:** `app/inventario/reglas.py`

```python
def descontar_stock(stock_actual: int, cantidad: int) -> int:
    """Devuelve el nuevo stock. Nunca negativo.
    Errores: DatosInvalidosError (cantidad no entera o <= 0);
             StockInsuficienteError(disponible=stock_actual) si cantidad > stock_actual."""
```

| ID | Técnica | Entrada (stock, cantidad) | Esperado |
| --- | --- | --- | --- |
| CP-03-01 | Partición válida | (10, 3) | 7 |
| CP-03-02 | Valor límite inferior | (10, 1) | 9 |
| CP-03-03 | Valor límite | (10, 9) | 1 |
| CP-03-04 | Valor límite | (10, 10) | 0 |
| CP-03-05 | Valor límite superior | (10, 11) | `StockInsuficienteError`, `disponible == 10` |
| CP-03-06 | Particiones inválidas | (10, 0) · (10, -1) · (10, 2.5) | `DatosInvalidosError` |
| CP-03-07 | Stock agotado | (0, 1) | `StockInsuficienteError`, `disponible == 0` |
| CP-03-08 | Mensaje claro (RF-19) | (10, 11) | el mensaje contiene "10" y "disponible" |

> La concurrencia real (dos ventas al mismo tiempo) se prueba en la Fase 2 a nivel de servicio/integración con bloqueo de filas; aquí se prueba la regla.

---

## Función 4 · `calcular_porcentaje_diferencia` (RF-28 · RNF-02 · RN-06 a RN-08)

**Archivo:** `app/conciliacion/reglas.py`

```python
UMBRAL_CONFORMIDAD = Decimal("2.00")

@dataclass(frozen=True)
class ResultadoConciliacion:
    diferencia: int          # stock_sistema - stock_fisico (con signo)
    porcentaje: Decimal      # 2 decimales, ROUND_HALF_UP
    conforme: bool           # porcentaje (redondeado) <= 2.00

def calcular_porcentaje_diferencia(stock_sistema: int, stock_fisico: int) -> ResultadoConciliacion:
    """% = |sistema - físico| / físico × 100. Si físico = 0: 0 % si sistema = 0, si no 100 %.
    La conformidad se evalúa sobre el % redondeado (lo mismo que ve el usuario).
    Errores: DatosInvalidosError si algún valor es negativo o no entero."""
```

| ID | Técnica | Entrada (sistema, físico) | Esperado |
| --- | --- | --- | --- |
| CP-04-01 | Partición válida | (100, 100) | 0.00 % · conforme · diferencia 0 |
| CP-04-02 | Valor límite (sobrante) | (102, 100) | 2.00 % · **conforme** · diferencia +2 |
| CP-04-03 | Valor límite (faltante) | (98, 100) | 2.00 % · **conforme** · diferencia −2 |
| CP-04-04 | Justo sobre el límite | (10201, 10000) | 2.01 % · **no conforme** |
| CP-04-05 | Partición no conforme | (103, 100) | 3.00 % · no conforme |
| CP-04-06 | Exactitud con redondeo | (100, 97) | 3.09 % · no conforme |
| CP-04-07 | Conforme no exacto | (50, 51) | 1.96 % · conforme |
| CP-04-08 | Límite por redondeo | (5099, 4999) | 2.0004 → **2.00 %** · conforme |
| CP-04-09 | División entre cero | (0, 0) | 0.00 % · conforme |
| CP-04-10 | División entre cero | (5, 0) | 100.00 % · no conforme |
| CP-04-11 | Particiones inválidas | físico −1 · físico 10.5 · sistema −1 | `DatosInvalidosError` |
