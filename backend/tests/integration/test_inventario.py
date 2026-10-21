import pytest
from fastapi.testclient import TestClient

from app.inventario.models import Categoria, Producto


@pytest.mark.integracion
def test_listar_productos_autenticado(
    client: TestClient,
    token_vendedor: str,
    producto_test: Producto,
):
    resp = client.get(
        "/api/v1/inventario/productos",
        headers={"Authorization": f"Bearer {token_vendedor}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert any(p["sku"] == "TEST-001" for p in data["items"])


@pytest.mark.integracion
def test_crear_producto_como_almacenero_exito(
    client: TestClient,
    token_almacenero: str,
    categoria_test: Categoria,
):
    payload = {
        "sku": "TEL-NUEVA-01",
        "nombre": "Tela Franela Nueva",
        "descripcion": "Franela suave para invierno",
        "categoria_id": categoria_test.id,
        "unidad": "metro",
        "precio": "25.50",
        "stock_actual": 50,
        "stock_minimo": 10,
    }

    resp = client.post(
        "/api/v1/inventario/productos",
        json=payload,
        headers={"Authorization": f"Bearer {token_almacenero}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["sku"] == "TEL-NUEVA-01"
    assert data["stock_actual"] == 50
    assert data["precio"] == "25.50"


@pytest.mark.integracion
def test_crear_producto_como_vendedor_retorna_403(
    client: TestClient,
    token_vendedor: str,
    categoria_test: Categoria,
):
    """RNF-24: el vendedor no tiene permiso para crear productos."""
    payload = {
        "sku": "TEL-PROHIBIDA",
        "nombre": "Tela No Permitida",
        "categoria_id": categoria_test.id,
        "precio": "10.00",
        "stock_actual": 10,
        "stock_minimo": 2,
    }

    resp = client.post(
        "/api/v1/inventario/productos",
        json=payload,
        headers={"Authorization": f"Bearer {token_vendedor}"},
    )
    assert resp.status_code == 403
    assert resp.json()["codigo"] == "PERMISO_DENEGADO"


@pytest.mark.integracion
def test_ingreso_stock_actualiza_cantidad(
    client: TestClient,
    token_almacenero: str,
    producto_test: Producto,
):
    resp = client.post(
        f"/api/v1/inventario/productos/{producto_test.id}/ingreso",
        json={
            "cantidad": 30,
            "proveedor": "Textil San Pedro SAC",
            "documento": "GR-00123",
            "motivo": "Ingreso por compra local",
        },
        headers={"Authorization": f"Bearer {token_almacenero}"},
    )
    assert resp.status_code == 200
    assert resp.json()["stock_actual"] == 130


@pytest.mark.integracion
def test_ajuste_stock_modifica_inventario(
    client: TestClient,
    token_almacenero: str,
    producto_test: Producto,
):
    resp = client.post(
        f"/api/v1/inventario/productos/{producto_test.id}/ajuste",
        json={
            "nuevo_stock": 85,
            "motivo": "Ajuste por conteo físico mensual",
        },
        headers={"Authorization": f"Bearer {token_almacenero}"},
    )
    assert resp.status_code == 200
    assert resp.json()["stock_actual"] == 85
