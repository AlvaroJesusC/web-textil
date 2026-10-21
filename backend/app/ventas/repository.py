from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.auditoria.models import Bitacora
from app.ventas.models import MetodoPago, Venta


class VentaRepository:
    """Acceso a datos para la entidad Venta y sus detalles (RNF-17)."""

    def __init__(self, db: Session):
        self.db = db

    def generar_siguiente_numero(self) -> str:
        stmt = select(func.coalesce(func.max(Venta.id), 0))
        ultimo_id = self.db.scalar(stmt) or 0
        siguiente = ultimo_id + 1
        return f"V-{siguiente:06d}"

    def obtener_por_id(self, venta_id: int) -> Venta | None:
        stmt = select(Venta).options(selectinload(Venta.detalles)).where(Venta.id == venta_id)
        return self.db.scalar(stmt)

    def listar(
        self,
        skip: int = 0,
        limit: int = 20,
        vendedor_id: int | None = None,
        metodo_pago: MetodoPago | None = None,
        fecha_desde: datetime | None = None,
        fecha_hasta: datetime | None = None,
    ) -> tuple[list[Venta], int]:
        query = select(Venta).options(selectinload(Venta.detalles))

        if vendedor_id:
            query = query.where(Venta.vendedor_id == vendedor_id)

        if metodo_pago:
            query = query.where(Venta.metodo_pago == metodo_pago.value)

        if fecha_desde:
            query = query.where(Venta.fecha >= fecha_desde)

        if fecha_hasta:
            query = query.where(Venta.fecha <= fecha_hasta)

        total_stmt = select(func.count()).select_from(query.subquery())
        total = self.db.scalar(total_stmt) or 0

        items_stmt = query.order_by(Venta.fecha.desc()).offset(skip).limit(limit)
        items = list(self.db.scalars(items_stmt).all())
        return items, total

    def crear(self, venta: Venta) -> Venta:
        self.db.add(venta)
        self.db.flush()
        return venta

    def registrar_bitacora(self, bitacora: Bitacora) -> None:
        self.db.add(bitacora)
        self.db.flush()
