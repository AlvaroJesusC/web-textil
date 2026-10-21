from decimal import Decimal

import pytest

from app.core.excepciones import DatosInvalidosError, DescuentoNoPermitidoError
from app.ventas.reglas import ItemVenta, calcular_total_venta


@pytest.mark.unitaria
def test_calcular_total_venta_particion_valida():
    """CP-02-01 · Partición válida · RF-21: [2 × 10.00] con desc 0 genera total 23.60."""
    items = [ItemVenta(cantidad=2, precio_unitario=Decimal("10.00"))]
    res = calcular_total_venta(items, descuento_pct=Decimal("0"))

    assert res.subtotal == Decimal("20.00")
    assert res.descuento == Decimal("0.00")
    assert res.base_imponible == Decimal("20.00")
    assert res.igv == Decimal("3.60")
    assert res.total == Decimal("23.60")


@pytest.mark.unitaria
def test_calcular_total_venta_exactitud_varios_items_con_descuento():
    """CP-02-02 · Exactitud · RF-21: [3 × 12.50, 2 × 4.90] con desc 10% genera total 50.23."""
    items = [
        ItemVenta(cantidad=3, precio_unitario=Decimal("12.50")),
        ItemVenta(cantidad=2, precio_unitario=Decimal("4.90")),
    ]
    res = calcular_total_venta(items, descuento_pct=Decimal("10"))

    assert res.subtotal == Decimal("47.30")
    assert res.descuento == Decimal("4.73")
    assert res.base_imponible == Decimal("42.57")
    assert res.igv == Decimal("7.66")
    assert res.total == Decimal("50.23")


@pytest.mark.unitaria
def test_calcular_total_venta_redondeo_igv_half_up():
    """CP-02-03 · Redondeo IGV HALF_UP · RN-01: [1 × 0.25] IGV 0.045 redondea a 0.05, total 0.30."""
    items = [ItemVenta(cantidad=1, precio_unitario=Decimal("0.25"))]
    res = calcular_total_venta(items, descuento_pct=Decimal("0"))

    assert res.subtotal == Decimal("0.25")
    assert res.igv == Decimal("0.05")
    assert res.total == Decimal("0.30")


@pytest.mark.unitaria
def test_calcular_total_venta_redondeo_descuento_half_up():
    """CP-02-04 · Redondeo descuento HALF_UP · RN-01: [1 × 0.50] desc 1% -> 0.01."""
    items = [ItemVenta(cantidad=1, precio_unitario=Decimal("0.50"))]
    res = calcular_total_venta(items, descuento_pct=Decimal("1"))

    assert res.subtotal == Decimal("0.50")
    assert res.descuento == Decimal("0.01")
    assert res.base_imponible == Decimal("0.49")
    assert res.igv == Decimal("0.09")
    assert res.total == Decimal("0.58")


@pytest.mark.unitaria
def test_calcular_total_venta_exactitud_con_descuento_15():
    """CP-02-05 · Exactitud · RF-21: [1 × 33.35] desc 15% -> total 33.45."""
    items = [ItemVenta(cantidad=1, precio_unitario=Decimal("33.35"))]
    res = calcular_total_venta(items, descuento_pct=Decimal("15"))

    assert res.subtotal == Decimal("33.35")
    assert res.descuento == Decimal("5.00")
    assert res.base_imponible == Decimal("28.35")
    assert res.igv == Decimal("5.10")
    assert res.total == Decimal("33.45")


@pytest.mark.unitaria
def test_calcular_total_venta_limite_descuento_100():
    """CP-02-06 · Valor límite · RN-03: descuento del 100% da total 0.00."""
    items = [ItemVenta(cantidad=2, precio_unitario=Decimal("50.00"))]
    res = calcular_total_venta(items, descuento_pct=Decimal("100"))

    assert res.subtotal == Decimal("100.00")
    assert res.descuento == Decimal("100.00")
    assert res.base_imponible == Decimal("0.00")
    assert res.igv == Decimal("0.00")
    assert res.total == Decimal("0.00")


@pytest.mark.unitaria
def test_calcular_total_venta_tope_exacto_se_acepta():
    """CP-02-07 · Valor límite · RF-20: descuento igual al tope (10%) es permitido."""
    items = [ItemVenta(cantidad=1, precio_unitario=Decimal("100.00"))]
    res = calcular_total_venta(items, descuento_pct=Decimal("10"), tope_descuento_pct=Decimal("10"))
    assert res.descuento == Decimal("10.00")


@pytest.mark.unitaria
def test_calcular_total_venta_tope_excedido_lanza_error():
    """CP-02-08 · Valor límite (tope) · RF-20: 10.01% supera tope 10% y lanza error."""
    items = [ItemVenta(cantidad=1, precio_unitario=Decimal("100.00"))]
    with pytest.raises(DescuentoNoPermitidoError) as exc_info:
        calcular_total_venta(
            items,
            descuento_pct=Decimal("10.01"),
            tope_descuento_pct=Decimal("10"),
        )
    assert exc_info.value.maximo_permitido == Decimal("10")


@pytest.mark.unitaria
def test_calcular_total_venta_descuento_negativo_lanza_error():
    """CP-02-09 · Partición inválida · RN-03: descuento < 0 es rechazado."""
    items = [ItemVenta(cantidad=1, precio_unitario=Decimal("10.00"))]
    with pytest.raises(DatosInvalidosError):
        calcular_total_venta(items, descuento_pct=Decimal("-1"))


@pytest.mark.unitaria
def test_calcular_total_venta_descuento_mayor_a_100_lanza_error():
    """CP-02-10 · Partición inválida · RN-03: descuento > 100% es rechazado."""
    items = [ItemVenta(cantidad=1, precio_unitario=Decimal("10.00"))]
    with pytest.raises(DatosInvalidosError):
        calcular_total_venta(items, descuento_pct=Decimal("100.01"))


@pytest.mark.unitaria
def test_calcular_total_venta_items_vacio_lanza_error():
    """CP-02-11 · Partición inválida · RN-04: lista de ítems vacía es rechazada."""
    with pytest.raises(DatosInvalidosError):
        calcular_total_venta([], descuento_pct=Decimal("0"))


@pytest.mark.unitaria
@pytest.mark.parametrize("cantidad", [0, -1], ids=["cero", "negativo"])
def test_calcular_total_venta_cantidad_invalida_lanza_error(cantidad):
    """CP-02-12 · Partición inválida · RN-04: cantidad <= 0 es rechazada."""
    items = [ItemVenta(cantidad=cantidad, precio_unitario=Decimal("10.00"))]
    with pytest.raises(DatosInvalidosError):
        calcular_total_venta(items)


@pytest.mark.unitaria
@pytest.mark.parametrize("precio", [Decimal("0"), Decimal("-1.00")], ids=["cero", "negativo"])
def test_calcular_total_venta_precio_invalido_lanza_error(precio):
    """CP-02-13 · Partición inválida · RN-04: precio unitario <= 0 es rechazado."""
    items = [ItemVenta(cantidad=1, precio_unitario=precio)]
    with pytest.raises(DatosInvalidosError):
        calcular_total_venta(items)


@pytest.mark.unitaria
def test_calcular_total_venta_todos_los_montos_son_decimal_con_dos_decimales():
    """CP-02-14 · Tipo de resultado · RN-01: todos los importes son Decimal con exponente -2."""
    items = [ItemVenta(cantidad=2, precio_unitario=Decimal("14.50"))]
    res = calcular_total_venta(items, descuento_pct=Decimal("5"))

    for monto in [res.subtotal, res.descuento, res.base_imponible, res.igv, res.total]:
        assert isinstance(monto, Decimal)
        assert monto.as_tuple().exponent == -2


@pytest.mark.unitaria
def test_calcular_total_venta_descuento_no_decimal_convierte_correctamente():
    """CP-02-15 · Tipos · RN-03: descuento pasado como entero o float es convertido."""

    items = [ItemVenta(cantidad=2, precio_unitario=Decimal("50.00"))]
    res_int = calcular_total_venta(items, descuento_pct=10)  # type: ignore[arg-type]
    assert res_int.descuento == Decimal("10.00")

    res_str = calcular_total_venta(items, descuento_pct="10.50")  # type: ignore[arg-type]
    assert res_str.descuento == Decimal("10.50")


@pytest.mark.unitaria
def test_calcular_total_venta_descuento_no_numerico_lanza_error():
    """CP-02-16 · Partición inválida · RN-03: descuento no convertible a número lanza error."""
    items = [ItemVenta(cantidad=1, precio_unitario=Decimal("10.00"))]
    with pytest.raises(DatosInvalidosError, match="porcentaje de descuento debe ser un valor"):
        calcular_total_venta(items, descuento_pct="diez_porciento")  # type: ignore[arg-type]


@pytest.mark.unitaria
def test_calcular_total_venta_tope_no_decimal_convierte_correctamente():
    """CP-02-17 · Conversión de tipos · RN-03: tope de descuento como entero es admitido."""
    items = [ItemVenta(cantidad=1, precio_unitario=Decimal("100.00"))]
    res = calcular_total_venta(
        items,
        descuento_pct=Decimal("10.00"),
        tope_descuento_pct=10,  # type: ignore[arg-type]
    )
    assert res.descuento == Decimal("10.00")


@pytest.mark.unitaria
def test_calcular_total_venta_tope_no_numerico_lanza_error():
    """CP-02-18 · Partición inválida · RN-03: tope no numérico lanza error."""
    items = [ItemVenta(cantidad=1, precio_unitario=Decimal("100.00"))]
    with pytest.raises(DatosInvalidosError, match="tope de descuento debe ser un valor"):
        calcular_total_venta(
            items,
            descuento_pct=Decimal("5.00"),
            tope_descuento_pct="tope_invalido",  # type: ignore[arg-type]
        )


@pytest.mark.unitaria
def test_calcular_total_venta_precio_unitario_no_decimal_convierte_correctamente():
    """CP-02-19 · Conversión de tipos · RN-04: precio unitario como float o int se convierte."""
    items = [ItemVenta(cantidad=2, precio_unitario=25.50)]  # type: ignore[arg-type]
    res = calcular_total_venta(items)
    assert res.subtotal == Decimal("51.00")


@pytest.mark.unitaria
def test_calcular_total_venta_precio_unitario_no_numerico_lanza_error():
    """CP-02-20 · Partición inválida · RN-04: precio unitario con texto no numérico lanza error."""
    items = [ItemVenta(cantidad=1, precio_unitario="caro")]  # type: ignore[arg-type]
    with pytest.raises(DatosInvalidosError, match="precio unitario debe ser un valor"):
        calcular_total_venta(items)
