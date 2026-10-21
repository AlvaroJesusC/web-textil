from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.inventario.models import (
    Categoria,
    EstadoProducto,
    MovimientoInventario,
    Producto,
)


class ProductoRepository:
    """Acceso a datos para el catálogo de inventario y movimientos (RNF-17)."""

    def __init__(self, db: Session):
        self.db = db

    def obtener_por_id(self, producto_id: int) -> Producto | None:
        stmt = (
            select(Producto)
            .options(joinedload(Producto.categoria))
            .where(Producto.id == producto_id)
        )
        return self.db.scalar(stmt)

    def obtener_por_id_con_bloqueo(self, producto_id: int) -> Producto | None:
        """Obtiene el producto con bloqueo de fila para operaciones
        transaccionales (F-02, RNF-16).
        """
        stmt = (
            select(Producto)
            .options(joinedload(Producto.categoria))
            .where(Producto.id == producto_id)
            .with_for_update()
        )
        return self.db.scalar(stmt)

    def obtener_por_sku(self, sku: str) -> Producto | None:
        stmt = (
            select(Producto)
            .options(joinedload(Producto.categoria))
            .where(Producto.sku == sku.strip().upper())
        )
        return self.db.scalar(stmt)

    def listar(
        self,
        skip: int = 0,
        limit: int = 20,
        termino_busqueda: str | None = None,
        categoria_id: int | None = None,
        solo_activos: bool = False,
    ) -> tuple[list[Producto], int]:
        query = select(Producto).options(joinedload(Producto.categoria))

        if solo_activos:
            query = query.where(Producto.estado == EstadoProducto.ACTIVO.value)

        if categoria_id:
            query = query.where(Producto.categoria_id == categoria_id)

        if termino_busqueda and termino_busqueda.strip():
            patron = f"%{termino_busqueda.strip()}%"
            query = query.where(
                or_(
                    Producto.nombre.ilike(patron),
                    Producto.sku.ilike(patron),
                )
            )

        total_stmt = select(func.count()).select_from(query.subquery())
        total = self.db.scalar(total_stmt) or 0

        items_stmt = query.order_by(Producto.nombre.asc()).offset(skip).limit(limit)
        items = list(self.db.scalars(items_stmt).all())
        return items, total

    def crear(self, producto: Producto) -> Producto:
        self.db.add(producto)
        self.db.flush()
        return producto

    def registrar_movimiento(self, movimiento: MovimientoInventario) -> MovimientoInventario:
        self.db.add(movimiento)
        self.db.flush()
        return movimiento

    def listar_movimientos(self, producto_id: int, limit: int = 50) -> list[MovimientoInventario]:
        stmt = (
            select(MovimientoInventario)
            .where(MovimientoInventario.producto_id == producto_id)
            .order_by(MovimientoInventario.fecha.desc())
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())

    # Categorías
    def listar_categorias(self) -> list[Categoria]:
        stmt = select(Categoria).order_by(Categoria.nombre.asc())
        return list(self.db.scalars(stmt).all())

    def obtener_categoria_por_id(self, categoria_id: int) -> Categoria | None:
        return self.db.get(Categoria, categoria_id)

    def crear_categoria(self, categoria: Categoria) -> Categoria:
        self.db.add(categoria)
        self.db.flush()
        return categoria
