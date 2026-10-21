import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import hashear_contrasena
from app.usuarios.models import EstadoUsuario, RolUsuario, Usuario


@pytest.mark.integracion
def test_login_exitoso_retorna_token_jwt(client: TestClient, db_session: Session):
    user = Usuario(
        nombre="Juan Vendedor",
        usuario="juan_vendedor",
        contrasena_hash=hashear_contrasena("ClaveSegura123!"),
        rol=RolUsuario.VENDEDOR.value,
        estado=EstadoUsuario.ACTIVO.value,
    )
    db_session.add(user)
    db_session.commit()

    resp = client.post(
        "/api/v1/auth/login",
        json={"usuario": "juan_vendedor", "contrasena": "ClaveSegura123!"},
    )

    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["usuario"]["usuario"] == "juan_vendedor"
    assert data["usuario"]["rol"] == "vendedor"


@pytest.mark.integracion
def test_login_credenciales_invalidas_retorna_401(client: TestClient, db_session: Session):
    user = Usuario(
        nombre="Pedro Almacen",
        usuario="pedro_almacen",
        contrasena_hash=hashear_contrasena("Clave123!"),
        rol=RolUsuario.ALMACENERO.value,
        estado=EstadoUsuario.ACTIVO.value,
    )
    db_session.add(user)
    db_session.commit()

    resp = client.post(
        "/api/v1/auth/login",
        json={"usuario": "pedro_almacen", "contrasena": "ClaveErronea!"},
    )

    assert resp.status_code == 401
    assert resp.json()["codigo"] == "CREDENCIALES_INVALIDAS"


@pytest.mark.integracion
def test_login_bloqueo_despues_de_5_intentos_fallidos(client: TestClient, db_session: Session):
    user = Usuario(
        nombre="Carlos Bloqueo",
        usuario="carlos_bloqueo",
        contrasena_hash=hashear_contrasena("Clave123!"),
        rol=RolUsuario.VENDEDOR.value,
        estado=EstadoUsuario.ACTIVO.value,
    )
    db_session.add(user)
    db_session.commit()

    for _ in range(4):
        client.post(
            "/api/v1/auth/login",
            json={"usuario": "carlos_bloqueo", "contrasena": "Erronea"},
        )

    # 5to intento
    resp = client.post(
        "/api/v1/auth/login",
        json={"usuario": "carlos_bloqueo", "contrasena": "Erronea"},
    )
    assert resp.status_code == 403
    assert resp.json()["codigo"] == "CUENTA_BLOQUEADA"


@pytest.mark.integracion
def test_consultar_me_autenticado_retorna_perfil(client: TestClient, token_vendedor: str):
    resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token_vendedor}"},
    )
    assert resp.status_code == 200
    assert resp.json()["usuario"] == "vendedor_test"


@pytest.mark.integracion
def test_consultar_me_sin_token_retorna_401(client: TestClient):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401
