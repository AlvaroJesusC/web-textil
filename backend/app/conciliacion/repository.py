from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.conciliacion.models import ConteoFisico, DetalleConteo, EstadoConteo
from app.inventario.models import EstadoProducto, Producto


class ConciliacionRepository:
    """Acceso a datos para el módulo de Conciliación de Stock (RF-27 al RF-29, RNF-17)."""

    def __init__(self, db: Session):
        self.db = db

    def crear_conteo(self, responsable_id: int, observaciones: str | None = None) -> ConteoFisico:
        """Crea una nueva sesión de conteo físico y captura el stock del sistema (RF-27, F-04)."""
        stmt_productos = (
            select(Producto)
            .where(Producto.estado == EstadoProducto.ACTIVO.value)
            .order_by(Producto.sku.asc())
        )
        productos = list(self.db.scalars(stmt_productos))

        conteo = ConteoFisico(
            responsable_id=responsable_id,
            estado=EstadoConteo.BORRADOR.value,
            observaciones=observaciones,
            total_items=len(productos),
            items_conformes=0,
            items_no_conformes=0,
        )
        self.db.add(conteo)
        self.db.flush()

        for prod in productos:
            detalle = DetalleConteo(
                conteo_id=conteo.id,
                producto_id=prod.id,
                stock_sistema=prod.stock_actual,
                stock_fisico=None,
                diferencia=None,
                porcentaje_diferencia=None,
                conforme=None,
                ajustado=False,
            )
            self.db.add(detalle)

        self.db.flush()
        return conteo

    def obtener_por_id(self, conteo_id: int) -> ConteoFisico | None:
        """Obtiene un conteo físico completo con sus detalles y productos cargados."""
        stmt = (
            select(ConteoFisico)
            .options(
                joinedload(ConteoFisico.responsable),
                joinedload(ConteoFisico.detalles)
                .joinedload(DetalleConteo.producto)
                .joinedload(Producto.categoria),
            )
            .where(ConteoFisico.id == conteo_id)
        )
        return self.db.scalar(stmt)

    def listar(self, estado: str | None = None, limit: int = 50) -> list[ConteoFisico]:
        """Lista el historial de sesiones de conteo físico."""
        stmt = (
            select(ConteoFisico)
            .options(joinedload(ConteoFisico.responsable))
            .order_by(ConteoFisico.fecha.desc())
            .limit(limit)
        )
        if estado:
            stmt = stmt.where(ConteoFisico.estado == estado)
        return list(self.db.scalars(stmt))
