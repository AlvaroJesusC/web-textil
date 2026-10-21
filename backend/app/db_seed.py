from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import select

from app.core.database import Base, SessionLocal, engine
from app.core.security import hashear_contrasena
from app.inventario.models import (
    Categoria,
    EstadoProducto,
    MovimientoInventario,
    Producto,
    TipoMovimiento,
    UnidadMedida,
)
from app.usuarios.models import EstadoUsuario, RolUsuario, Usuario


def poblar_datos_semilla():
    """Genera las tablas e inserta los datos iniciales necesarios para el sistema."""
    print("Creando tablas en la base de datos...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Usuarios del sistema (4 roles)
        usuarios_data = [
            (
                "Administrador del Sistema",
                "admin",
                "Admin123!",
                RolUsuario.ADMINISTRADOR,
            ),
            ("Vendedor Comercial", "vendedor1", "Vendedor123!", RolUsuario.VENDEDOR),
            ("Encargado de Almacén", "almacen1", "Almacen123!", RolUsuario.ALMACENERO),
            ("Gerente General", "gerente1", "Gerente123!", RolUsuario.GERENTE),
        ]

        usuarios_creados: dict[str, Usuario] = {}
        for nombre, user_str, clave, rol in usuarios_data:
            stmt = select(Usuario).where(Usuario.usuario == user_str)
            existente = db.scalar(stmt)
            if not existente:
                usuario = Usuario(
                    nombre=nombre,
                    usuario=user_str,
                    contrasena_hash=hashear_contrasena(clave),
                    rol=rol.value,
                    estado=EstadoUsuario.ACTIVO.value,
                    debe_cambiar_clave=False,
                )
                db.add(usuario)
                db.flush()
                usuarios_creados[user_str] = usuario
                print(f"  + Usuario creado: {user_str} ({rol.value})")
            else:
                usuarios_creados[user_str] = existente

        # 2. Categorías textiles
        categorias_data = [
            ("Telas de Algodón", "Telas 100% algodón nacional y pima para confección"),
            ("Telas Sintéticas y Mezclas", "Poliéster, viscosa, lycra y mezclas deportivas"),
            ("Hilos y Conos", "Conos de hilo para costura recta, remalle y recubierto"),
            ("Avíos y Accesorios", "Botones, cierres, elásticos y cintas"),
            ("Prendas Terminadas", "Prendas de vestir listas para venta mayorista o menor"),
        ]

        categorias_map: dict[str, Categoria] = {}
        for nombre_cat, desc in categorias_data:
            stmt = select(Categoria).where(Categoria.nombre == nombre_cat)
            existente = db.scalar(stmt)
            if not existente:
                cat = Categoria(nombre=nombre_cat, descripcion=desc)
                db.add(cat)
                db.flush()
                categorias_map[nombre_cat] = cat
                print(f"  + Categoría creada: {nombre_cat}")
            else:
                categorias_map[nombre_cat] = existente

        admin_user = usuarios_creados.get("admin")
        admin_id = admin_user.id if admin_user else None

        # 3. Productos textiles realistas
        productos_data = [
            (
                "TEL-001",
                "Tela Jersey 30/1 Algodón Peinado Blanco",
                "Telas de Algodón",
                UnidadMedida.METRO,
                Decimal("14.50"),
                150,
                20,
            ),
            (
                "TEL-002",
                "Tela Rib 1x1 Algodón con Lycra Negro",
                "Telas de Algodón",
                UnidadMedida.METRO,
                Decimal("18.00"),
                80,
                15,
            ),
            (
                "TEL-003",
                "Tela Piqué 24/1 Algodón Tangüis Azul Marino",
                "Telas de Algodón",
                UnidadMedida.METRO,
                Decimal("22.50"),
                65,
                10,
            ),
            (
                "TEL-004",
                "Tela Franela Reactiva 100% Algodón Plomo",
                "Telas de Algodón",
                UnidadMedida.METRO,
                Decimal("26.00"),
                45,
                10,
            ),
            (
                "TEL-005",
                "Tela Drill 100% Algodón Pesado Caqui",
                "Telas de Algodón",
                UnidadMedida.METRO,
                Decimal("19.80"),
                120,
                25,
            ),
            (
                "HIL-001",
                "Cono de Hilo Poliéster 40/2 Blanco 5000m",
                "Hilos y Conos",
                UnidadMedida.CONO,
                Decimal("8.50"),
                200,
                30,
            ),
            (
                "HIL-002",
                "Cono de Hilo Poliéster 40/2 Negro 5000m",
                "Hilos y Conos",
                UnidadMedida.CONO,
                Decimal("8.50"),
                180,
                30,
            ),
            (
                "AVI-001",
                "Cierre Invisible Nylon 18cm (Ciento)",
                "Avíos y Accesorios",
                UnidadMedida.BOLSA,
                Decimal("35.00"),
                25,
                5,
            ),
            (
                "AVI-002",
                "Botón Poliéster Camisero 4 Huecos (Gruesa)",
                "Avíos y Accesorios",
                UnidadMedida.BOLSA,
                Decimal("12.00"),
                40,
                8,
            ),
            (
                "PRE-001",
                "Polo Cuello Redondo Algodón Pima Talla M",
                "Prendas Terminadas",
                UnidadMedida.UNIDAD,
                Decimal("28.00"),
                50,
                10,
            ),
            (
                "PRE-002",
                "Polo Cuello Camisero Piqué Blanco Talla L",
                "Prendas Terminadas",
                UnidadMedida.UNIDAD,
                Decimal("38.00"),
                4,
                10,
            ),  # Stock bajo para probar alertas
            (
                "PRE-003",
                "Casaca Drill Liviana Unisex Talla M",
                "Prendas Terminadas",
                UnidadMedida.UNIDAD,
                Decimal("75.00"),
                0,
                5,
            ),  # Stock agotado para probar filtros
        ]

        for sku, nombre, cat_nombre, unidad, precio, stock, stock_min in productos_data:
            stmt = select(Producto).where(Producto.sku == sku)
            existente = db.scalar(stmt)
            if not existente:
                categoria = categorias_map[cat_nombre]
                prod = Producto(
                    sku=sku,
                    nombre=nombre,
                    categoria_id=categoria.id,
                    unidad=unidad.value,
                    precio=precio,
                    stock_actual=stock,
                    stock_minimo=stock_min,
                    estado=EstadoProducto.ACTIVO.value,
                )
                db.add(prod)
                db.flush()

                if stock > 0:
                    mov = MovimientoInventario(
                        producto_id=prod.id,
                        tipo=TipoMovimiento.INGRESO.value,
                        cantidad=stock,
                        stock_anterior=0,
                        stock_resultante=stock,
                        motivo="Inventario inicial por carga de datos semilla",
                        usuario_id=admin_id,
                        fecha=datetime.now(UTC),
                    )
                    db.add(mov)

                print(f"  + Producto creado: [{sku}] {nombre} (Stock: {stock})")

        db.commit()
        print("\n¡Datos semilla cargados con éxito!")

    except Exception as e:
        db.rollback()
        print(f"Error al poblar base de datos: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    poblar_datos_semilla()
