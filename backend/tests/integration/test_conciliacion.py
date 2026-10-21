import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.inventario.models import Producto


@pytest.mark.integracion
def test_iniciar_conteo_almacenero_exito(
    client: TestClient,
    token_almacenero: str,
    producto_test: Producto,
):
    """RF-27: almacenero puede iniciar una sesión de conteo físico."""
    resp = client.post(
        "/api/v1/conteos",
        json={"observaciones": "Conteo mensual de telas de algodón"},
        headers={"Authorization": f"Bearer {token_almacenero}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["estado"] == "borrador"
    assert len(data["detalles"]) >= 1
    assert any(i["producto_id"] == producto_test.id for i in data["detalles"])


@pytest.mark.integracion
def test_iniciar_conteo_vendedor_retorna_403(
    client: TestClient,
    token_vendedor: str,
):
    """RNF-24: el vendedor no tiene permiso para iniciar conteos físicos."""
    resp = client.post(
        "/api/v1/conteos",
        json={"observaciones": "Intento no autorizado"},
        headers={"Authorization": f"Bearer {token_vendedor}"},
    )
    assert resp.status_code == 403
    assert resp.json()["codigo"] == "PERMISO_DENEGADO"


@pytest.mark.integracion
def test_flujo_completo_conteo_calcular_cerrar_y_ajustar(
    client: TestClient,
    token_admin: str,
    token_almacenero: str,
    producto_test: Producto,
    db_session: Session,
):
    """RF-27 a RF-30: flujo completo desde captura, ingreso físico, semáforo, cierre y ajuste."""
    # 1. Iniciar conteo (stock_actual en BD es 100)
    init_resp = client.post(
        "/api/v1/conteos",
        json={"observaciones": "Auditoría de inventario"},
        headers={"Authorization": f"Bearer {token_almacenero}"},
    )
    assert init_resp.status_code == 201
    conteo_id = init_resp.json()["id"]

    # 2. Registrar conteo físico: encontramos 98 unidades (-2%, justo en el límite conforme)
    put_resp = client.put(
        f"/api/v1/conteos/{conteo_id}/items",
        json={"items": [{"producto_id": producto_test.id, "stock_fisico": 98}]},
        headers={"Authorization": f"Bearer {token_almacenero}"},
    )
    assert put_resp.status_code == 200

    # 3. Calcular diferencias y semáforo
    calc_resp = client.post(
        f"/api/v1/conteos/{conteo_id}/calcular",
        headers={"Authorization": f"Bearer {token_almacenero}"},
    )
    assert calc_resp.status_code == 200
    calc_data = calc_resp.json()
    item = next(i for i in calc_data["detalles"] if i["producto_id"] == producto_test.id)
    assert item["diferencia"] == 2
    assert item["porcentaje_diferencia"] == "2.04"  # |100-98|/98 = 2.0408% -> 2.04%
    assert item["conforme"] is False  # > 2.00%

    # 4. Listar conteos
    list_resp = client.get(
        "/api/v1/conteos",
        headers={"Authorization": f"Bearer {token_almacenero}"},
    )
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 1

    # 5. Obtener detalle de conteo
    get_resp = client.get(
        f"/api/v1/conteos/{conteo_id}",
        headers={"Authorization": f"Bearer {token_almacenero}"},
    )
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == conteo_id

    # 6. Almacenero intenta ajustar y falla (403)
    ajuste_alm_resp = client.post(
        f"/api/v1/conteos/{conteo_id}/ajustar",
        json={"motivo": "Ajuste no autorizado"},
        headers={"Authorization": f"Bearer {token_almacenero}"},
    )
    assert ajuste_alm_resp.status_code == 403

    # 7. Cerrar conteo físico
    cerrar_resp = client.post(
        f"/api/v1/conteos/{conteo_id}/cerrar",
        headers={"Authorization": f"Bearer {token_almacenero}"},
    )
    assert cerrar_resp.status_code == 200
    assert cerrar_resp.json()["estado"] == "cerrado"

    # 8. Administrador aplica ajuste de inventario según el conteo
    ajuste_resp = client.post(
        f"/api/v1/conteos/{conteo_id}/ajustar",
        json={"motivo": "Ajuste regularización post-auditoría"},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert ajuste_resp.status_code == 200
    assert ajuste_resp.json()["productos_ajustados"] >= 1

    # Verificar que el stock en la base de datos se actualizó a 98
    db_session.refresh(producto_test)
    assert producto_test.stock_actual == 98
