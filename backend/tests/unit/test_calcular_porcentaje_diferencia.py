from decimal import Decimal

import pytest

from app.conciliacion.reglas import calcular_porcentaje_diferencia
from app.core.excepciones import DatosInvalidosError


@pytest.mark.unitaria
def test_calcular_diferencia_exacta_sin_diferencias():
    """CP-04-01 · Partición válida · RN-06: sistema=100, físico=100 -> 0.00% conforme."""
    res = calcular_porcentaje_diferencia(stock_sistema=100, stock_fisico=100)
    assert res.diferencia == 0
    assert res.porcentaje == Decimal("0.00")
    assert res.conforme is True


@pytest.mark.unitaria
def test_calcular_diferencia_sobrante_limite_2_porciento():
    """CP-04-02 · Valor límite (sobrante) · RNF-02: 102 vs 100 -> +2.00% conforme."""
    res = calcular_porcentaje_diferencia(stock_sistema=102, stock_fisico=100)
    assert res.diferencia == 2
    assert res.porcentaje == Decimal("2.00")
    assert res.conforme is True


@pytest.mark.unitaria
def test_calcular_diferencia_faltante_limite_2_porciento():
    """CP-04-03 · Valor límite (faltante) · RNF-02: 98 vs 100 -> -2.00% conforme."""
    res = calcular_porcentaje_diferencia(stock_sistema=98, stock_fisico=100)
    assert res.diferencia == -2
    assert res.porcentaje == Decimal("2.00")
    assert res.conforme is True


@pytest.mark.unitaria
def test_calcular_diferencia_justo_sobre_el_limite():
    """CP-04-04 · Justo sobre el límite · RN-06: 10201 vs 10000 -> 2.01% no conforme."""
    res = calcular_porcentaje_diferencia(stock_sistema=10201, stock_fisico=10000)
    assert res.porcentaje == Decimal("2.01")
    assert res.conforme is False


@pytest.mark.unitaria
def test_calcular_diferencia_particion_no_conforme():
    """CP-04-05 · Partición no conforme · RN-06: 103 vs 100 -> 3.00% no conforme."""
    res = calcular_porcentaje_diferencia(stock_sistema=103, stock_fisico=100)
    assert res.porcentaje == Decimal("3.00")
    assert res.conforme is False


@pytest.mark.unitaria
def test_calcular_diferencia_exactitud_con_redondeo():
    """CP-04-06 · Exactitud con redondeo · RN-06: 100 vs 97 -> 3.0927 -> 3.09% no conforme."""
    res = calcular_porcentaje_diferencia(stock_sistema=100, stock_fisico=97)
    assert res.porcentaje == Decimal("3.09")
    assert res.conforme is False


@pytest.mark.unitaria
def test_calcular_diferencia_conforme_no_exacto():
    """CP-04-07 · Conforme no exacto · RN-06: 50 vs 51 -> 1.96% conforme."""
    res = calcular_porcentaje_diferencia(stock_sistema=50, stock_fisico=51)
    assert res.porcentaje == Decimal("1.96")
    assert res.conforme is True


@pytest.mark.unitaria
def test_calcular_diferencia_limite_por_redondeo_half_up():
    """CP-04-08 · Límite por redondeo · RN-06: 5099 vs 4999 -> 2.0004 -> 2.00% conforme."""
    res = calcular_porcentaje_diferencia(stock_sistema=5099, stock_fisico=4999)
    assert res.porcentaje == Decimal("2.00")
    assert res.conforme is True


@pytest.mark.unitaria
def test_calcular_diferencia_ambos_cero():
    """CP-04-09 · División entre cero · RN-07: (0, 0) -> 0.00% conforme."""
    res = calcular_porcentaje_diferencia(stock_sistema=0, stock_fisico=0)
    assert res.porcentaje == Decimal("0.00")
    assert res.conforme is True


@pytest.mark.unitaria
def test_calcular_diferencia_fisico_cero_sistema_positivo():
    """CP-04-10 · División entre cero · RN-07: (5, 0) -> 100.00% no conforme."""
    res = calcular_porcentaje_diferencia(stock_sistema=5, stock_fisico=0)
    assert res.porcentaje == Decimal("100.00")
    assert res.conforme is False


@pytest.mark.unitaria
@pytest.mark.parametrize(
    ("sistema", "fisico"),
    [(-1, 100), (100, -1), (10.5, 100)],
    ids=["sistema_negativo", "fisico_negativo", "sistema_decimal"],
)
def test_calcular_diferencia_particiones_invalidas_lanza_error(sistema, fisico):
    """CP-04-11 · Particiones inválidas · RN-08: valores no válidos son rechazados."""
    with pytest.raises(DatosInvalidosError):
        calcular_porcentaje_diferencia(stock_sistema=sistema, stock_fisico=fisico)  # type: ignore[arg-type]
