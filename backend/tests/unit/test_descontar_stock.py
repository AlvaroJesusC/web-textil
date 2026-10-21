import pytest

from app.core.excepciones import DatosInvalidosError, StockInsuficienteError
from app.inventario.reglas import descontar_stock


@pytest.mark.unitaria
def test_descontar_stock_particion_valida():
    """CP-03-01 · Partición válida · RF-23: descontar 3 con 10 en stock deja 7."""
    nuevo_stock = descontar_stock(stock_actual=10, cantidad=3)
    assert nuevo_stock == 7


@pytest.mark.unitaria
def test_descontar_stock_limite_inferior():
    """CP-03-02 · Valor límite inferior · RN-05: descontar 1 con 10 deja 9."""
    assert descontar_stock(stock_actual=10, cantidad=1) == 9


@pytest.mark.unitaria
def test_descontar_stock_limite_casi_todo():
    """CP-03-03 · Valor límite · RN-05: descontar 9 con 10 deja 1."""
    assert descontar_stock(stock_actual=10, cantidad=9) == 1


@pytest.mark.unitaria
def test_descontar_stock_limite_todo_el_stock():
    """CP-03-04 · Valor límite · RF-19: vender exactamente todo el stock deja 0."""
    assert descontar_stock(stock_actual=10, cantidad=10) == 0


@pytest.mark.unitaria
def test_descontar_stock_cantidad_mayor_lanza_error():
    """CP-03-05 · Valor límite superior · RF-19: pedir 11 con 10 lanza error."""
    with pytest.raises(StockInsuficienteError) as exc_info:
        descontar_stock(stock_actual=10, cantidad=11)
    assert exc_info.value.disponible == 10
    assert exc_info.value.solicitado == 11


@pytest.mark.unitaria
@pytest.mark.parametrize("cantidad", [0, -1, 2.5], ids=["cero", "negativa", "decimal"])
def test_descontar_stock_cantidad_invalida_lanza_error(cantidad):
    """CP-03-06 · Particiones inválidas · RN-05: cantidad debe ser entero > 0."""
    with pytest.raises(DatosInvalidosError):
        descontar_stock(stock_actual=10, cantidad=cantidad)  # type: ignore[arg-type]


@pytest.mark.unitaria
def test_descontar_stock_agotado_lanza_error():
    """CP-03-07 · Stock agotado · RF-19: vender producto con stock 0 lanza error."""
    with pytest.raises(StockInsuficienteError) as exc_info:
        descontar_stock(stock_actual=0, cantidad=1)
    assert exc_info.value.disponible == 0


@pytest.mark.unitaria
def test_descontar_stock_mensaje_claro_incluye_disponible_y_nombre():
    """CP-03-08 · Mensaje claro · RF-19: el mensaje informa el producto y el stock disponible."""
    with pytest.raises(StockInsuficienteError) as exc_info:
        descontar_stock(
            stock_actual=10,
            cantidad=15,
            producto_nombre="Tela Algodón Pima",
            sku="TEL-001",
        )
    mensaje = str(exc_info.value)
    assert "10" in mensaje
    assert "disponible" in mensaje.lower()
    assert "Tela Algodón Pima" in mensaje
