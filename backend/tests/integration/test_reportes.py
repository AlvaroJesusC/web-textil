import pytest
from fastapi.testclient import TestClient

from app.inventario.models import Producto


@pytest.mark.integracion
def test_reportes_resumen_kpis_admin_exito(
    client: TestClient,
    token_admin: str,
    producto_test: Producto,
):
    """RF-30, RF-32: administrador puede consultar resumen de KPIs."""
    resp = client.get(
        "/api/v1/reportes/resumen",
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "total_ingresos" in data
    assert "total_transacciones" in data
    assert "ticket_promedio" in data
    assert "productos_stock_bajo" in data
    assert "productos_agotados" in data


@pytest.mark.integracion
def test_reportes_ventas_por_dia_admin_exito(
    client: TestClient,
    token_admin: str,
):
    """RF-30: serie temporal de ventas por día."""
    resp = client.get(
        "/api/v1/reportes/ventas-por-dia",
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.integracion
def test_reportes_productos_mas_vendidos_exito(
    client: TestClient,
    token_admin: str,
):
    """RF-31: ranking de productos más vendidos."""
    resp = client.get(
        "/api/v1/reportes/productos-mas-vendidos?limit=5",
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.integracion
def test_reportes_ventas_por_vendedor_exito(
    client: TestClient,
    token_admin: str,
):
    """RF-30: ventas agrupadas por vendedor."""
    resp = client.get(
        "/api/v1/reportes/ventas-por-vendedor",
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.integracion
def test_reportes_ventas_por_metodo_pago_exito(
    client: TestClient,
    token_admin: str,
):
    """RF-30: distribución de medios de pago."""
    resp = client.get(
        "/api/v1/reportes/ventas-por-metodo-pago",
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.integracion
def test_reportes_alertas_stock_exito(
    client: TestClient,
    token_admin: str,
):
    """RF-31: listado de alertas de stock."""
    resp = client.get(
        "/api/v1/reportes/alertas-stock",
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.integracion
def test_reportes_acceso_denegado_a_vendedor(
    client: TestClient,
    token_vendedor: str,
):
    """RNF-24: el rol vendedor no puede ver los reportes gerenciales."""
    resp = client.get(
        "/api/v1/reportes/resumen",
        headers={"Authorization": f"Bearer {token_vendedor}"},
    )
    assert resp.status_code == 403
    assert resp.json()["codigo"] == "PERMISO_DENEGADO"
