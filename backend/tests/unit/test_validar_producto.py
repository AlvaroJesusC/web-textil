from decimal import Decimal

import pytest

from app.inventario.models import EstadoStock
from app.inventario.reglas import DatosProducto, estado_stock, validar_producto


@pytest.mark.unitaria
def test_validar_producto_datos_completos_es_valido():
    """CP-01-01 · Partición válida · RF-07: producto con campos correctos."""
    datos = DatosProducto(
        sku="TEL-001",
        nombre="Tela jersey algodón",
        precio=Decimal("12.50"),
        stock=40,
        stock_minimo=5,
    )
    errores = validar_producto(datos)
    assert errores == {}


@pytest.mark.unitaria
def test_validar_producto_nombre_vacio_genera_error():
    """CP-01-02 · Partición inválida · RN-09: nombre vacío genera error."""
    datos = DatosProducto(sku="TEL-001", nombre="", precio=Decimal("12.50"), stock=10)
    errores = validar_producto(datos)
    assert "nombre" in errores


@pytest.mark.unitaria
def test_validar_producto_nombre_solo_espacios_genera_error():
    """CP-01-03 · Partición inválida · RN-09: nombre con solo espacios es rechazado."""
    datos = DatosProducto(sku="TEL-001", nombre="   ", precio=Decimal("12.50"), stock=10)
    errores = validar_producto(datos)
    assert "nombre" in errores


@pytest.mark.unitaria
def test_validar_producto_sku_vacio_genera_error():
    """CP-01-04 · Partición inválida · RN-09: SKU obligatorio."""
    datos = DatosProducto(sku="", nombre="Tela Rib", precio=Decimal("12.50"), stock=10)
    errores = validar_producto(datos)
    assert "sku" in errores


@pytest.mark.unitaria
def test_validar_producto_precio_cero_genera_error():
    """CP-01-05 · Valor límite · RN-09: precio = 0 no está permitido."""
    datos = DatosProducto(sku="TEL-001", nombre="Tela", precio=Decimal("0.00"), stock=10)
    errores = validar_producto(datos)
    assert "precio" in errores


@pytest.mark.unitaria
def test_validar_producto_precio_minimo_positivo_es_valido():
    """CP-01-06 · Valor límite · RN-09: precio = 0.01 es el valor mínimo aceptado."""
    datos = DatosProducto(sku="TEL-001", nombre="Tela", precio=Decimal("0.01"), stock=10)
    errores = validar_producto(datos)
    assert "precio" not in errores


@pytest.mark.unitaria
def test_validar_producto_precio_negativo_genera_error():
    """CP-01-07 · Partición inválida · RN-09: precio negativo genera error."""
    datos = DatosProducto(sku="TEL-001", nombre="Tela", precio=Decimal("-5.00"), stock=10)
    errores = validar_producto(datos)
    assert "precio" in errores


@pytest.mark.unitaria
def test_validar_producto_stock_cero_es_valido():
    """CP-01-08 · Valor límite · RN-09: stock = 0 es válido al crear producto agotado."""
    datos = DatosProducto(sku="TEL-001", nombre="Tela", precio=Decimal("15.00"), stock=0)
    errores = validar_producto(datos)
    assert "stock" not in errores


@pytest.mark.unitaria
def test_validar_producto_stock_negativo_genera_error():
    """CP-01-09 · Valor límite · RN-09: stock negativo es rechazado."""
    datos = DatosProducto(sku="TEL-001", nombre="Tela", precio=Decimal("15.00"), stock=-1)
    errores = validar_producto(datos)
    assert "stock" in errores


@pytest.mark.unitaria
def test_validar_producto_stock_minimo_negativo_genera_error():
    """CP-01-10 · Partición inválida · RN-09: stock mínimo negativo es rechazado."""
    datos = DatosProducto(
        sku="TEL-001", nombre="Tela", precio=Decimal("15.00"), stock=5, stock_minimo=-1
    )
    errores = validar_producto(datos)
    assert "stock_minimo" in errores


@pytest.mark.unitaria
def test_validar_producto_multiples_errores_reporta_todos():
    """CP-01-11 · Múltiples errores · RN-09: devuelve todos los errores juntos."""
    datos = DatosProducto(sku="", nombre="", precio=Decimal("0.00"), stock=-1)
    errores = validar_producto(datos)
    assert "sku" in errores
    assert "nombre" in errores
    assert "precio" in errores
    assert "stock" in errores


@pytest.mark.unitaria
def test_estado_stock_cero_es_agotado():
    """CP-01-12 · estado_stock · RN-10: stock = 0 resulta en estado agotado."""
    assert estado_stock(stock=0, stock_minimo=5, activo=True) == EstadoStock.AGOTADO


@pytest.mark.unitaria
def test_estado_stock_limite_minimo_es_bajo():
    """CP-01-13 · estado_stock · RN-10: stock igual al mínimo es bajo."""
    assert estado_stock(stock=5, stock_minimo=5, activo=True) == EstadoStock.BAJO


@pytest.mark.unitaria
def test_estado_stock_sobre_minimo_es_normal():
    """CP-01-14 · estado_stock · RN-10: stock mayor al mínimo es normal."""
    assert estado_stock(stock=6, stock_minimo=5, activo=True) == EstadoStock.NORMAL


@pytest.mark.unitaria
def test_estado_stock_inactivo_tiene_prioridad():
    """CP-01-15 · estado_stock · RN-10: inactivo prevalece sobre stock."""
    assert estado_stock(stock=10, stock_minimo=5, activo=False) == EstadoStock.INACTIVO


@pytest.mark.unitaria
def test_validar_producto_precio_conversion_desde_float_o_str_valido():
    """CP-01-16 · Conversión de tipos · RN-09: precio numérico en string o float es convertido."""
    datos_str = DatosProducto(
        sku="TEL-001",
        nombre="Tela",
        precio="15.50",
        stock=10,  # type: ignore[arg-type]
    )
    assert "precio" not in validar_producto(datos_str)

    datos_float = DatosProducto(
        sku="TEL-001",
        nombre="Tela",
        precio=15.50,
        stock=10,  # type: ignore[arg-type]
    )
    assert "precio" not in validar_producto(datos_float)


@pytest.mark.unitaria
def test_validar_producto_precio_no_numerico_genera_error():
    """CP-01-17 · Partición inválida · RN-09: precio con texto no numérico genera error."""
    datos = DatosProducto(
        sku="TEL-001",
        nombre="Tela",
        precio="invalido",
        stock=10,  # type: ignore[arg-type]
    )
    errores = validar_producto(datos)
    assert "precio" in errores


@pytest.mark.unitaria
@pytest.mark.parametrize(
    "stock_invalido",
    ["10", 10.5, True, False],
    ids=["string", "decimal", "booleano_true", "booleano_false"],
)
def test_validar_producto_stock_no_entero_genera_error(stock_invalido):
    """CP-01-18 · Partición inválida · RN-09: stock que no es entero estricto genera error."""
    datos = DatosProducto(
        sku="TEL-001",
        nombre="Tela",
        precio=Decimal("15.00"),
        stock=stock_invalido,  # type: ignore[arg-type]
    )
    errores = validar_producto(datos)
    assert "stock" in errores


@pytest.mark.unitaria
@pytest.mark.parametrize(
    "minimo_invalido",
    ["5", 5.5, True, False],
    ids=["string", "decimal", "booleano_true", "booleano_false"],
)
def test_validar_producto_stock_minimo_no_entero_genera_error(minimo_invalido):
    """CP-01-19 · Partición inválida · RN-09: stock mínimo no entero estricto genera error."""
    datos = DatosProducto(
        sku="TEL-001",
        nombre="Tela",
        precio=Decimal("15.00"),
        stock=10,
        stock_minimo=minimo_invalido,  # type: ignore[arg-type]
    )
    errores = validar_producto(datos)
    assert "stock_minimo" in errores
