import argparse
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import delete, select

from app.auditoria.models import Bitacora
from app.conciliacion.models import ConteoFisico, DetalleConteo, EstadoConteo
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
from app.ventas.models import DetalleVenta, EstadoVenta, MetodoPago, Venta
from app.ventas.reglas import ItemVenta, calcular_total_venta


def limpiar_base_de_datos(db) -> None:
    """Elimina los datos existentes en orden inverso de claves foráneas."""
    print("Limpiando tablas existentes para re-poblado limpio...")
    db.execute(delete(DetalleConteo))
    db.execute(delete(ConteoFisico))
    db.execute(delete(DetalleVenta))
    db.execute(delete(Venta))
    db.execute(delete(MovimientoInventario))
    db.execute(delete(Bitacora))
    db.execute(delete(Producto))
    db.execute(delete(Categoria))
    db.execute(delete(Usuario))
    db.commit()
    print("Tablas limpiadas con éxito.")


def poblar_datos_semilla(reiniciar: bool = False) -> None:
    """Crea las tablas y puebla una base de datos textil realista y completa."""
    print("Asegurando creación de tablas en la base de datos...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if reiniciar:
            limpiar_base_de_datos(db)

        # -------------------------------------------------------------
        # 1. USUARIOS DEL SISTEMA (4 Roles definidos en RN y RNF)
        # -------------------------------------------------------------
        usuarios_data = [
            (
                "Administrador del Sistema",
                "admin",
                "Admin123!",
                RolUsuario.ADMINISTRADOR,
            ),
            (
                "Javier Quispe (Vendedor Mostrador)",
                "vendedor1",
                "Vendedor123!",
                RolUsuario.VENDEDOR,
            ),
            (
                "Carlos Mendoza (Jefe de Almacén)",
                "almacen1",
                "Almacen123!",
                RolUsuario.ALMACENERO,
            ),
            (
                "Patricia Ramos (Gerente General)",
                "gerente1",
                "Gerente123!",
                RolUsuario.GERENTE,
            ),
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

        admin_user = usuarios_creados.get("admin")
        vendedor_user = usuarios_creados.get("vendedor1") or admin_user
        almacen_user = usuarios_creados.get("almacen1") or admin_user

        # -------------------------------------------------------------
        # 2. CATEGORÍAS TEXTILES DEL MERCADO DE LIMA / GAMARRA
        # -------------------------------------------------------------
        categorias_data = [
            (
                "Telas de Algodón y Punto",
                "Telas 100% algodón nacional, jersey peinado, rib, franela, piqué y gamuza pima.",
            ),
            (
                "Telas Planas y Drilles",
                (
                    "Telas rígidas y semi-rígidas para confección: "
                    "drill pesado, gabardina, denim y popelina."
                ),
            ),
            (
                "Telas Sintéticas y Deportivas",
                (
                    "Tejidos sintéticos de alta rotación: "
                    "licra spandex, microfibra sublimable, win dry-fit y polar."
                ),
            ),
            (
                "Hilos y Conos de Costura",
                (
                    "Conos de hilo industrial para recta 40/2, "
                    "remalladora, recubridora e hilo de pespunte 20/2."
                ),
            ),
            (
                "Avíos, Cierres y Accesorios",
                (
                    "Accesorios de costura: cierres invisibles, "
                    "cierres tractor, botones de pasta y elásticos reforzados."
                ),
            ),
            (
                "Prendas y Confecciones",
                (
                    "Prendas terminadas listas para distribución: "
                    "polos pima, polos box piqué, poleras y casacas."
                ),
            ),
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

        # -------------------------------------------------------------
        # 3. CATÁLOGO DE 30 PRODUCTOS TEXTILES REALISTAS
        # -------------------------------------------------------------
        # Formato: (SKU, Nombre, Categoría, Unidad, Precio, Stock Inicial, Stock Mínimo)
        productos_data = [
            # Telas de Algodón y Punto (metro)
            (
                "TEL-001",
                "Tela Jersey 30/1 Algodón Peinado Blanco Óptico",
                "Telas de Algodón y Punto",
                UnidadMedida.METRO,
                Decimal("14.50"),
                180,
                25,
            ),
            (
                "TEL-002",
                "Tela Jersey 30/1 Algodón Reactivo Negro Azabache",
                "Telas de Algodón y Punto",
                UnidadMedida.METRO,
                Decimal("15.20"),
                140,
                25,
            ),
            (
                "TEL-003",
                "Tela Rib 1x1 Algodón con Spandex Negro",
                "Telas de Algodón y Punto",
                UnidadMedida.METRO,
                Decimal("18.00"),
                65,
                15,
            ),
            (
                "TEL-004",
                "Tela Rib 1x1 Blanco Peinado Tubular",
                "Telas de Algodón y Punto",
                UnidadMedida.METRO,
                Decimal("17.50"),
                80,
                15,
            ),
            (
                "TEL-005",
                "Tela Piqué 24/1 Algodón Tangüis Azul Marino",
                "Telas de Algodón y Punto",
                UnidadMedida.METRO,
                Decimal("22.50"),
                95,
                20,
            ),
            (
                "TEL-006",
                "Tela Piqué 24/1 Algodón Peinado Rojo Carmín",
                "Telas de Algodón y Punto",
                UnidadMedida.METRO,
                Decimal("22.00"),
                70,
                15,
            ),
            (
                "TEL-007",
                "Tela Franela Reactiva 100% Algodón Plomo Melange",
                "Telas de Algodón y Punto",
                UnidadMedida.METRO,
                Decimal("26.00"),
                55,
                15,
            ),
            (
                "TEL-008",
                "Tela Interlock 40/1 Algodón Pima Bebé Blanco",
                "Telas de Algodón y Punto",
                UnidadMedida.METRO,
                Decimal("29.00"),
                45,
                10,
            ),
            (
                "TEL-009",
                "Tela Gamuza Pima 50/1 Algodón Suave Azul Noche",
                "Telas de Algodón y Punto",
                UnidadMedida.METRO,
                Decimal("32.50"),
                12,  # Stock bajo (< min 15) para probar alertas
                15,
            ),
            # Telas Planas y Drilles (metro)
            (
                "TEL-010",
                "Tela Drill Nuevo Mundo 100% Algodón Caqui Pesado",
                "Telas Planas y Drilles",
                UnidadMedida.METRO,
                Decimal("19.80"),
                160,
                30,
            ),
            (
                "TEL-011",
                "Tela Drill San Jacinto Azul Marino Industrial",
                "Telas Planas y Drilles",
                UnidadMedida.METRO,
                Decimal("20.50"),
                130,
                25,
            ),
            (
                "TEL-012",
                "Tela Denim Rígido 12 oz Índigo Clásico",
                "Telas Planas y Drilles",
                UnidadMedida.METRO,
                Decimal("24.00"),
                110,
                20,
            ),
            (
                "TEL-013",
                "Tela Popelina Camisera 50/1 Celeste Pastel",
                "Telas Planas y Drilles",
                UnidadMedida.METRO,
                Decimal("13.50"),
                90,
                15,
            ),
            (
                "TEL-014",
                "Tela Lino Rústico Confección Verano Arena",
                "Telas Planas y Drilles",
                UnidadMedida.METRO,
                Decimal("27.50"),
                40,
                10,
            ),
            (
                "TEL-015",
                "Tela Gabardina Stretch Sastrería Negro",
                "Telas Planas y Drilles",
                UnidadMedida.METRO,
                Decimal("25.00"),
                8,  # Stock bajo (< min 12)
                12,
            ),
            # Telas Deportivas y Sintéticas (metro)
            (
                "TEL-016",
                "Tela Lycra Spandex Deportiva Negro Mate",
                "Telas Sintéticas y Deportivas",
                UnidadMedida.METRO,
                Decimal("21.00"),
                120,
                20,
            ),
            (
                "TEL-017",
                "Tela Microfibra Suave Estampable Sublimación",
                "Telas Sintéticas y Deportivas",
                UnidadMedida.METRO,
                Decimal("16.50"),
                85,
                15,
            ),
            (
                "TEL-018",
                "Tela Win Fresca Deportiva Dry-Fit Rojo Escarlata",
                "Telas Sintéticas y Deportivas",
                UnidadMedida.METRO,
                Decimal("14.80"),
                105,
                20,
            ),
            (
                "TEL-019",
                "Tela Taslán Engomado Impermeable Marino",
                "Telas Sintéticas y Deportivas",
                UnidadMedida.METRO,
                Decimal("18.50"),
                75,
                15,
            ),
            (
                "TEL-020",
                "Tela Polar Soft Térmico Antipeeling Plomo",
                "Telas Sintéticas y Deportivas",
                UnidadMedida.METRO,
                Decimal("17.00"),
                0,  # Agotado para probar filtros
                10,
            ),
            # Hilos y Conos de Costura (cono)
            (
                "HIL-001",
                "Cono Hilo Poliéster 40/2 Coats Cadena Blanco 5000m",
                "Hilos y Conos de Costura",
                UnidadMedida.CONO,
                Decimal("8.50"),
                240,
                40,
            ),
            (
                "HIL-002",
                "Cono Hilo Poliéster 40/2 Coats Cadena Negro 5000m",
                "Hilos y Conos de Costura",
                UnidadMedida.CONO,
                Decimal("8.50"),
                210,
                40,
            ),
            (
                "HIL-003",
                "Cono Hilo Texturizado Remalle Azul Marino",
                "Hilos y Conos de Costura",
                UnidadMedida.CONO,
                Decimal("9.80"),
                115,
                20,
            ),
            (
                "HIL-004",
                "Cono Hilo Pespunte Jean 20/2 Marrón Ocre 3000m",
                "Hilos y Conos de Costura",
                UnidadMedida.CONO,
                Decimal("11.00"),
                60,
                15,
            ),
            (
                "HIL-005",
                "Cono Hilo Pespunte Drill Caqui 3000m",
                "Hilos y Conos de Costura",
                UnidadMedida.CONO,
                Decimal("10.20"),
                5,  # Stock bajo (< min 15)
                15,
            ),
            # Avíos, Cierres y Accesorios (bolsa)
            (
                "AVI-001",
                "Cierre Invisible Nylon 18cm Tono Blanco (Ciento)",
                "Avíos, Cierres y Accesorios",
                UnidadMedida.BOLSA,
                Decimal("35.00"),
                35,
                8,
            ),
            (
                "AVI-002",
                "Cierre Invisible Nylon 18cm Tono Negro (Ciento)",
                "Avíos, Cierres y Accesorios",
                UnidadMedida.BOLSA,
                Decimal("35.00"),
                30,
                8,
            ),
            (
                "AVI-003",
                "Cierre Tractor Dientes Gruesos 60cm Casaca (50 un)",
                "Avíos, Cierres y Accesorios",
                UnidadMedida.BOLSA,
                Decimal("58.00"),
                22,
                5,
            ),
            (
                "AVI-004",
                "Botón Poliéster Camisero 4 Huecos Nácar (Gruesa 144 un)",
                "Avíos, Cierres y Accesorios",
                UnidadMedida.BOLSA,
                Decimal("12.00"),
                45,
                10,
            ),
            (
                "AVI-005",
                "Elástico Mercerizado Reforzado 3cm x 50m (Rollo)",
                "Avíos, Cierres y Accesorios",
                UnidadMedida.BOLSA,
                Decimal("26.50"),
                28,
                6,
            ),
            (
                "AVI-006",
                "Entretela Termoadhesiva Fusionable Blanca 100m",
                "Avíos, Cierres y Accesorios",
                UnidadMedida.BOLSA,
                Decimal("48.00"),
                0,  # Agotado
                5,
            ),
            # Prendas y Confecciones (unidad)
            (
                "PRE-001",
                "Polo Cuello Redondo Algodón Pima 50/1 Blanco Talla M",
                "Prendas y Confecciones",
                UnidadMedida.UNIDAD,
                Decimal("28.00"),
                85,
                15,
            ),
            (
                "PRE-002",
                "Polo Cuello Redondo Algodón Pima 50/1 Negro Talla L",
                "Prendas y Confecciones",
                UnidadMedida.UNIDAD,
                Decimal("28.00"),
                70,
                15,
            ),
            (
                "PRE-003",
                "Polo Box Cuello Camisero Piqué Azul Marino Talla M",
                "Prendas y Confecciones",
                UnidadMedida.UNIDAD,
                Decimal("38.00"),
                45,
                10,
            ),
            (
                "PRE-004",
                "Polera Franela Fleece con Capucha Unisex Plomo L",
                "Prendas y Confecciones",
                UnidadMedida.UNIDAD,
                Decimal("54.00"),
                32,
                8,
            ),
            (
                "PRE-005",
                "Casaca Drill Liviana Forrada Unisex Caqui Talla M",
                "Prendas y Confecciones",
                UnidadMedida.UNIDAD,
                Decimal("75.00"),
                18,
                5,
            ),
        ]

        prods_dict: dict[str, Producto] = {}
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
                        motivo="Inventario inicial de apertura de almacén textil",
                        usuario_id=almacen_user.id if almacen_user else None,
                        fecha=datetime.now(UTC) - timedelta(days=35),
                    )
                    db.add(mov)

                prods_dict[sku] = prod
                print(f"  + Producto creado: [{sku}] {nombre} (Stock: {stock})")
            else:
                prods_dict[sku] = existente

        db.commit()

        # -------------------------------------------------------------
        # 4. VENTAS REALISTAS DISTRIBUIDAS EN EL TIEMPO (30 días)
        # -------------------------------------------------------------
        ahora = datetime.now(UTC)

        # Matriz de ventas realistas de tiendas y talleres de confección de Lima
        # (número, días_atrás, cliente, documento, método_pago, descuento_pct, items[(sku, cant)])
        ventas_data = [
            # --- VENTAS DE HOY (para filtros inmediatos y gráfico de hoy) ---
            (
                "V-202610-0028",
                0.1,
                "Confecciones San Pedro S.A.C.",
                "20601234567",
                MetodoPago.TRANSFERENCIA.value,
                Decimal("5.00"),
                [("TEL-001", 15), ("HIL-001", 6)],
            ),
            (
                "V-202610-0027",
                0.2,
                "Taller Textil Gamarra E.I.R.L.",
                "20556789123",
                MetodoPago.YAPE_PLIN.value,
                Decimal("0.00"),
                [("TEL-005", 10), ("AVI-004", 3)],
            ),
            (
                "V-202610-0026",
                0.3,
                "Cliente Mostrador (Venta Rápida)",
                None,
                MetodoPago.EFECTIVO.value,
                Decimal("0.00"),
                [("PRE-001", 3), ("HIL-002", 2)],
            ),
            (
                "V-202610-0025",
                0.4,
                "Boutique Elegancia San Isidro",
                "20445566778",
                MetodoPago.TARJETA.value,
                Decimal("5.00"),
                [("TEL-008", 8), ("PRE-003", 4)],
            ),
            # --- VENTAS DE LOS ÚLTIMOS 7 DÍAS ---
            (
                "V-202610-0024",
                1.0,
                "Creaciones El Sol S.A.",
                "20458923412",
                MetodoPago.TRANSFERENCIA.value,
                Decimal("10.00"),
                [("TEL-010", 25), ("HIL-004", 4)],
            ),
            (
                "V-202610-0023",
                1.5,
                "Taller de Confección Andrea",
                "10458923412",
                MetodoPago.YAPE_PLIN.value,
                Decimal("0.00"),
                [("TEL-002", 12), ("TEL-003", 5), ("HIL-002", 3)],
            ),
            (
                "V-202610-0022",
                2.0,
                "Modas y Diseños Lima S.A.C.",
                "20512398745",
                MetodoPago.TARJETA.value,
                Decimal("5.00"),
                [("TEL-016", 18), ("TEL-018", 10)],
            ),
            (
                "V-202610-0021",
                2.8,
                "Estampados Los Olivos",
                "20609874512",
                MetodoPago.EFECTIVO.value,
                Decimal("0.00"),
                [("TEL-017", 15), ("PRE-001", 6)],
            ),
            (
                "V-202610-0020",
                3.2,
                "Distribuidora Textil Huascarán",
                "20112233445",
                MetodoPago.TRANSFERENCIA.value,
                Decimal("10.00"),
                [("TEL-011", 20), ("AVI-003", 2)],
            ),
            (
                "V-202610-0019",
                4.0,
                "Cliente Mostrador (Sastrería)",
                "10789123456",
                MetodoPago.EFECTIVO.value,
                Decimal("0.00"),
                [("TEL-012", 14), ("HIL-004", 3)],
            ),
            (
                "V-202610-0018",
                5.0,
                "Confecciones Santa Anita E.I.R.L.",
                "20667788990",
                MetodoPago.YAPE_PLIN.value,
                Decimal("5.00"),
                [("TEL-007", 12), ("PRE-004", 5)],
            ),
            (
                "V-202610-0017",
                6.0,
                "Bordados & Diseños La Victoria",
                "20334455667",
                MetodoPago.TRANSFERENCIA.value,
                Decimal("0.00"),
                [("HIL-001", 10), ("HIL-002", 10), ("HIL-003", 5)],
            ),
            # --- VENTAS DE LOS ÚLTIMOS 14 A 30 DÍAS ---
            (
                "V-202610-0016",
                7.5,
                "Industrias Textiles del Centro",
                "20554433221",
                MetodoPago.TRANSFERENCIA.value,
                Decimal("10.00"),
                [("TEL-001", 30), ("TEL-002", 20)],
            ),
            (
                "V-202610-0015",
                8.5,
                "Taller Sastrería San Miguel",
                "10123456789",
                MetodoPago.EFECTIVO.value,
                Decimal("0.00"),
                [("TEL-013", 16), ("AVI-001", 2)],
            ),
            (
                "V-202610-0014",
                10.0,
                "Confecciones San Pedro S.A.C.",
                "20601234567",
                MetodoPago.TARJETA.value,
                Decimal("5.00"),
                [("TEL-005", 15), ("PRE-003", 6)],
            ),
            (
                "V-202610-0013",
                11.5,
                "Modas Juveniles Gamarra",
                "20556789123",
                MetodoPago.YAPE_PLIN.value,
                Decimal("0.00"),
                [("TEL-018", 20), ("TEL-016", 12)],
            ),
            (
                "V-202610-0012",
                13.0,
                "Taller Textil El Porvenir",
                "10987654321",
                MetodoPago.EFECTIVO.value,
                Decimal("0.00"),
                [("TEL-010", 18), ("HIL-004", 4)],
            ),
            (
                "V-202610-0011",
                14.5,
                "Boutique Elegancia San Isidro",
                "20445566778",
                MetodoPago.TRANSFERENCIA.value,
                Decimal("5.00"),
                [("TEL-014", 10), ("PRE-005", 2)],
            ),
            (
                "V-202610-0010",
                16.0,
                "Creaciones El Sol S.A.",
                "20458923412",
                MetodoPago.YAPE_PLIN.value,
                Decimal("0.00"),
                [("TEL-003", 15), ("TEL-004", 10)],
            ),
            (
                "V-202610-0009",
                18.0,
                "Estampados Los Olivos",
                "20609874512",
                MetodoPago.TARJETA.value,
                Decimal("5.00"),
                [("PRE-001", 10), ("PRE-002", 8)],
            ),
            (
                "V-202610-0008",
                20.0,
                "Distribuidora Textil Huascarán",
                "20112233445",
                MetodoPago.TRANSFERENCIA.value,
                Decimal("10.00"),
                [("TEL-012", 22), ("AVI-003", 3)],
            ),
            (
                "V-202610-0007",
                22.0,
                "Taller de Confección Andrea",
                "10458923412",
                MetodoPago.EFECTIVO.value,
                Decimal("0.00"),
                [("TEL-001", 14), ("HIL-001", 5)],
            ),
            (
                "V-202610-0006",
                24.0,
                "Modas y Diseños Lima S.A.C.",
                "20512398745",
                MetodoPago.YAPE_PLIN.value,
                Decimal("0.00"),
                [("TEL-007", 10), ("AVI-005", 2)],
            ),
            (
                "V-202610-0005",
                26.0,
                "Confecciones Santa Anita E.I.R.L.",
                "20667788990",
                MetodoPago.TRANSFERENCIA.value,
                Decimal("5.00"),
                [("TEL-005", 12), ("PRE-002", 5)],
            ),
            (
                "V-202610-0004",
                28.0,
                "Industrias Textiles del Centro",
                "20554433221",
                MetodoPago.TARJETA.value,
                Decimal("10.00"),
                [("TEL-010", 20), ("TEL-011", 15)],
            ),
        ]

        for num, dias_atras, cl_nom, cl_doc, met_pago, desc_pct, items_skus in ventas_data:
            stmt = select(Venta).where(Venta.numero == num)
            existente = db.scalar(stmt)
            if existente:
                continue

            f_venta = ahora - timedelta(days=dias_atras)
            items_calc = []
            detalles_info = []

            for sku, cant in items_skus:
                prod = prods_dict.get(sku)
                if prod:
                    items_calc.append(ItemVenta(cantidad=cant, precio_unitario=prod.precio))
                    detalles_info.append((prod, cant, prod.precio))

            if not items_calc:
                continue

            res = calcular_total_venta(items_calc, descuento_pct=desc_pct)
            venta = Venta(
                numero=num,
                fecha=f_venta,
                vendedor_id=vendedor_user.id if vendedor_user else admin_user.id,
                cliente_nombre=cl_nom,
                cliente_documento=cl_doc,
                metodo_pago=met_pago,
                subtotal=res.subtotal,
                descuento_pct=desc_pct,
                descuento=res.descuento,
                igv=res.igv,
                total=res.total,
                estado=EstadoVenta.CONFIRMADA.value,
                creado_en=f_venta,
            )
            db.add(venta)
            db.flush()

            for prod, cant, p_unit in detalles_info:
                subt_item = Decimal(cant) * p_unit
                det = DetalleVenta(
                    venta_id=venta.id,
                    producto_id=prod.id,
                    cantidad=cant,
                    precio_unitario=p_unit,
                    subtotal=subt_item,
                )
                db.add(det)

                # Kardex de salida por venta
                mov_salida = MovimientoInventario(
                    producto_id=prod.id,
                    tipo=TipoMovimiento.VENTA.value,
                    cantidad=cant,
                    stock_anterior=prod.stock_actual + cant,
                    stock_resultante=prod.stock_actual,
                    motivo=f"Venta confirmada {num} ({cl_nom or 'Mostrador'})",
                    documento=num,
                    usuario_id=vendedor_user.id if vendedor_user else None,
                    fecha=f_venta,
                )
                db.add(mov_salida)

            f_str = f_venta.strftime("%Y-%m-%d")
            print(f"  + Venta creada: {num} (Total: S/ {res.total}) - {f_str}")

        db.commit()

        # -------------------------------------------------------------
        # 5. SESIONES DE AUDITORÍA Y CONCILIACIÓN FÍSICA (Semáforo ≤ 2%)
        # -------------------------------------------------------------
        # Sesión 1: Auditoría general cerrada hace 10 días (Semáforo Verde de alta conformidad)
        stmt_conteo = select(ConteoFisico).where(
            ConteoFisico.observaciones == "Auditoría física quincenal de almacén central"
        )
        if not db.scalar(stmt_conteo):
            fecha_c1 = ahora - timedelta(days=10)
            todos_prods = list(prods_dict.values())
            conteo_previo = ConteoFisico(
                fecha=fecha_c1,
                responsable_id=almacen_user.id if almacen_user else admin_user.id,
                estado=EstadoConteo.CERRADO.value,
                observaciones="Auditoría física quincenal de almacén central",
                total_items=len(todos_prods),
                items_conformes=len(todos_prods) - 1,
                items_no_conformes=1,
                porcentaje_conformidad=Decimal("96.67"),
                cerrado_en=fecha_c1,
            )
            db.add(conteo_previo)
            db.flush()

            for i, prod in enumerate(todos_prods):
                # Solo el primer producto con leve diferencia simulada
                if i == 0:
                    stock_fis = max(0, prod.stock_actual - 4)
                    diff = prod.stock_actual - stock_fis
                    pct = Decimal("2.22")  # Supera levemente el 2%
                    conf = False
                else:
                    stock_fis = prod.stock_actual
                    diff = 0
                    pct = Decimal("0.00")
                    conf = True

                det_conteo = DetalleConteo(
                    conteo_id=conteo_previo.id,
                    producto_id=prod.id,
                    stock_sistema=prod.stock_actual,
                    stock_fisico=stock_fis,
                    diferencia=diff,
                    porcentaje_diferencia=pct,
                    conforme=conf,
                    ajustado=False,
                )
                db.add(det_conteo)

            print("  + Sesión de conciliación quincenal creada (96.67% conformidad).")

        # Sesión 2: Auditoría selectiva reciente (hace 2 días)
        stmt_conteo2 = select(ConteoFisico).where(
            ConteoFisico.observaciones == "Conteo físico rápido de Telas de Algodón y Hilos"
        )
        if not db.scalar(stmt_conteo2):
            fecha_c2 = ahora - timedelta(days=2)
            prods_muestra = [
                p
                for p in prods_dict.values()
                if "Algodón" in p.categoria.nombre or "Hilos" in p.categoria.nombre
            ]
            if prods_muestra:
                conteo_muestra = ConteoFisico(
                    fecha=fecha_c2,
                    responsable_id=almacen_user.id if almacen_user else admin_user.id,
                    estado=EstadoConteo.CERRADO.value,
                    observaciones="Conteo físico rápido de Telas de Algodón y Hilos",
                    total_items=len(prods_muestra),
                    items_conformes=len(prods_muestra),
                    items_no_conformes=0,
                    porcentaje_conformidad=Decimal("100.00"),
                    cerrado_en=fecha_c2,
                )
                db.add(conteo_muestra)
                db.flush()

                for prod in prods_muestra:
                    det = DetalleConteo(
                        conteo_id=conteo_muestra.id,
                        producto_id=prod.id,
                        stock_sistema=prod.stock_actual,
                        stock_fisico=prod.stock_actual,
                        diferencia=0,
                        porcentaje_diferencia=Decimal("0.00"),
                        conforme=True,
                        ajustado=False,
                    )
                    db.add(det)

                print("  + Sesión de conteo rápido creada (100% conformidad).")

        db.commit()
        print("\n¡Base de datos textil enriquecida exitosamente con datos realistas!")

    except Exception as e:
        db.rollback()
        print(f"Error al poblar la base de datos: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Poblar base de datos textil con datos semilla.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Limpia completamente las tablas antes de poblar para tener datos frescos.",
    )
    args = parser.parse_args()
    poblar_datos_semilla(reiniciar=args.reset)
