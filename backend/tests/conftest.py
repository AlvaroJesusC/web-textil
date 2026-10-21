from collections.abc import Generator
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import crear_token_acceso, hashear_contrasena
from app.inventario.models import Categoria, EstadoProducto, Producto, UnidadMedida
from app.main import app
from app.usuarios.models import EstadoUsuario, RolUsuario, Usuario
from app.ventas.reglas import ItemVenta

# Base de datos SQLite en memoria aislada para pruebas
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def preparar_tablas():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    """Provee una sesión limpia para cada prueba con rollback."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """Cliente HTTP de prueba con la sesión de BD inyectada."""

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def usuario_admin(db_session: Session) -> Usuario:
    user = Usuario(
        nombre="Admin Test",
        usuario="admin_test",
        contrasena_hash=hashear_contrasena("Admin123!"),
        rol=RolUsuario.ADMINISTRADOR.value,
        estado=EstadoUsuario.ACTIVO.value,
    )
    db_session.add(user)
    db_session.flush()
    return user


@pytest.fixture
def usuario_vendedor(db_session: Session) -> Usuario:
    user = Usuario(
        nombre="Vendedor Test",
        usuario="vendedor_test",
        contrasena_hash=hashear_contrasena("Vendedor123!"),
        rol=RolUsuario.VENDEDOR.value,
        estado=EstadoUsuario.ACTIVO.value,
    )
    db_session.add(user)
    db_session.flush()
    return user


@pytest.fixture
def usuario_almacenero(db_session: Session) -> Usuario:
    user = Usuario(
        nombre="Almacenero Test",
        usuario="almacen_test",
        contrasena_hash=hashear_contrasena("Almacen123!"),
        rol=RolUsuario.ALMACENERO.value,
        estado=EstadoUsuario.ACTIVO.value,
    )
    db_session.add(user)
    db_session.flush()
    return user


@pytest.fixture
def token_admin(usuario_admin: Usuario) -> str:
    return crear_token_acceso({"sub": str(usuario_admin.id), "rol": usuario_admin.rol})


@pytest.fixture
def token_vendedor(usuario_vendedor: Usuario) -> str:
    return crear_token_acceso({"sub": str(usuario_vendedor.id), "rol": usuario_vendedor.rol})


@pytest.fixture
def token_almacenero(usuario_almacenero: Usuario) -> str:
    return crear_token_acceso({"sub": str(usuario_almacenero.id), "rol": usuario_almacenero.rol})


@pytest.fixture
def categoria_test(db_session: Session) -> Categoria:
    cat = Categoria(nombre="Telas de Prueba", descripcion="Categoría para pruebas")
    db_session.add(cat)
    db_session.flush()
    return cat


@pytest.fixture
def producto_test(db_session: Session, categoria_test: Categoria) -> Producto:
    prod = Producto(
        sku="TEST-001",
        nombre="Tela Algodón Test",
        categoria_id=categoria_test.id,
        unidad=UnidadMedida.METRO.value,
        precio=Decimal("20.00"),
        stock_actual=100,
        stock_minimo=10,
        estado=EstadoProducto.ACTIVO.value,
    )
    db_session.add(prod)
    db_session.flush()
    return prod


@pytest.fixture
def items_venta_tipica() -> list[ItemVenta]:
    return [
        ItemVenta(cantidad=2, precio_unitario=Decimal("10.00")),
        ItemVenta(cantidad=1, precio_unitario=Decimal("25.00")),
    ]
