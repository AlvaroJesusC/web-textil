import pytest
from fastapi.testclient import TestClient

from app.usuarios.models import Usuario


@pytest.mark.integracion
def test_listar_usuarios_como_admin_exito(
    client: TestClient,
    token_admin: str,
    usuario_admin: Usuario,
):
    """RF-04: administrador puede listar usuarios."""
    resp = client.get(
        "/api/v1/usuarios",
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert any(u["id"] == usuario_admin.id for u in data["items"])


@pytest.mark.integracion
def test_crear_usuario_como_admin_exito(
    client: TestClient,
    token_admin: str,
):
    """RF-04: administrador crea nuevo usuario con rol asignado."""
    payload = {
        "nombre": "Nuevo Vendedor",
        "usuario": "nuevo_vendedor_01",
        "contrasena": "ClaveSegura2026!",
        "rol": "vendedor",
    }
    resp = client.post(
        "/api/v1/usuarios",
        json=payload,
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["usuario"] == "nuevo_vendedor_01"
    assert data["rol"] == "vendedor"
    assert data["estado"] == "activo"


@pytest.mark.integracion
def test_actualizar_usuario_exito(
    client: TestClient,
    token_admin: str,
    usuario_vendedor: Usuario,
):
    """RF-04: actualizar información de un usuario."""
    payload = {
        "nombre": "Vendedor Nombre Actualizado",
        "rol": "almacenero",
        "estado": "inactivo",
    }
    resp = client.put(
        f"/api/v1/usuarios/{usuario_vendedor.id}",
        json=payload,
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["nombre"] == "Vendedor Nombre Actualizado"
    assert data["rol"] == "almacenero"
    assert data["estado"] == "inactivo"


@pytest.mark.integracion
def test_restablecer_clave_exito(
    client: TestClient,
    token_admin: str,
    usuario_vendedor: Usuario,
):
    """RF-05: restablecer contraseña temporal."""
    resp = client.post(
        f"/api/v1/usuarios/{usuario_vendedor.id}/restablecer-clave?nueva_clave_temporal=TempPass2026!",
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resp.status_code == 200
    assert "restablecida" in resp.json()["mensaje"].lower()


@pytest.mark.integracion
def test_usuarios_acceso_denegado_a_no_admin(
    client: TestClient,
    token_vendedor: str,
):
    """RNF-24: el rol vendedor no puede acceder al módulo de gestión de usuarios."""
    resp = client.get(
        "/api/v1/usuarios",
        headers={"Authorization": f"Bearer {token_vendedor}"},
    )
    assert resp.status_code == 403
    assert resp.json()["codigo"] == "PERMISO_DENEGADO"
