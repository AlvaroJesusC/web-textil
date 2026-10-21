import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.inventario.models import Producto


@pytest.mark.integracion
def test_registrar_venta_transaccional_exitosa(
    client: TestClient,
    token_vendedor: str,
    producto_test: Producto,
    db_session: Session,
):
    """RF-19 a RF-23: registrar venta descuenta stock y calcula importes en una transacción."""
    payload = {
        "items": [{"producto_id": producto_test.id, "cantidad": 5}],
        "descuento_pct": "0.00",
        "metodo_pago": "efectivo",
        "cliente_nombre": "Confecciones Lima SAC",
        "cliente_documento": "20556677881",
    }

    resp = client.post(
        "/api/v1/ventas",
        json=payload,
        headers={"Authorization": f"Bearer {token_vendedor}"},
    )

    assert resp.status_code == 201
    data = resp.json()
    assert data["numero"].startswith("V-")
    # 5 × 20.00 = 100.00 subtotal, desc 0, igv 18.00, total 118.00
    assert data["subtotal"] == "100.00"
    assert data["igv"] == "18.00"
    assert data["total"] == "118.00"
    assert data["estado"] == "confirmada"

    # Verificar stock en base de datos
    db_session.refresh(producto_test)
    assert producto_test.stock_actual == 95  # 100 - 5


@pytest.mark.integracion
def test_registrar_venta_stock_insuficiente_rollback(
    client: TestClient,
    token_vendedor: str,
    producto_test: Producto,
    db_session: Session,
):
    """RF-19, RF-23, RNF-16: si no hay stock, error 409 y rollback total."""
    payload = {
        "items": [{"producto_id": producto_test.id, "cantidad": 150}],  # Solo hay 100
        "descuento_pct": "0.00",
        "metodo_pago": "efectivo",
    }

    resp = client.post(
        "/api/v1/ventas",
        json=payload,
        headers={"Authorization": f"Bearer {token_vendedor}"},
    )

    assert resp.status_code == 409
    assert resp.json()["codigo"] == "STOCK_INSUFICIENTE"
    assert "100" in resp.json()["detalle"]

    # El stock debe seguir intacto en 100
    db_session.refresh(producto_test)
    assert producto_test.stock_actual == 100


@pytest.mark.integracion
def test_vendedor_descuento_excedido_retorna_422(
    client: TestClient,
    token_vendedor: str,
    producto_test: Producto,
):
    """RF-20, RN-03: el vendedor tiene un tope máximo de 10% de descuento."""
    payload = {
        "items": [{"producto_id": producto_test.id, "cantidad": 2}],
        "descuento_pct": "15.00",  # Supera el tope del 10%
        "metodo_pago": "efectivo",
    }

    resp = client.post(
        "/api/v1/ventas",
        json=payload,
        headers={"Authorization": f"Bearer {token_vendedor}"},
    )

    assert resp.status_code == 422
    assert resp.json()["codigo"] == "DESCUENTO_NO_PERMITIDO"


@pytest.mark.integracion
def test_administrador_puede_aplicar_descuento_mayor(
    client: TestClient,
    token_admin: str,
    producto_test: Producto,
):
    """El administrador no tiene la restricción de 10%."""
    payload = {
        "items": [{"producto_id": producto_test.id, "cantidad": 2}],
        "descuento_pct": "20.00",
        "metodo_pago": "tarjeta",
    }

    resp = client.post(
        "/api/v1/ventas",
        json=payload,
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 201
    assert resp.json()["descuento_pct"] == "20.00"


@pytest.mark.integracion
def test_anular_venta_restaura_stock(
    client: TestClient,
    token_admin: str,
    producto_test: Producto,
    db_session: Session,
):
    """RF-26, F-05: la anulación por parte del administrador devuelve el stock."""
    # 1. Registrar venta de 10 unidades
    venta_resp = client.post(
        "/api/v1/ventas",
        json={
            "items": [{"producto_id": producto_test.id, "cantidad": 10}],
            "metodo_pago": "efectivo",
        },
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert venta_resp.status_code == 201
    venta_id = venta_resp.json()["id"]

    db_session.refresh(producto_test)
    assert producto_test.stock_actual == 90

    # 2. Anular venta
    anula_resp = client.post(
        f"/api/v1/ventas/{venta_id}/anular",
        json={"motivo": "Cliente desistió de la compra antes de la entrega"},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert anula_resp.status_code == 200
    assert anula_resp.json()["estado"] == "anulada"

    # 3. Verificar reposición de stock en BD
    db_session.refresh(producto_test)
    assert producto_test.stock_actual == 100
