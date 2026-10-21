from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auditoria.models import Bitacora
from app.conciliacion.models import ConteoFisico, DetalleConteo, EstadoConteo
from app.conciliacion.reglas import calcular_porcentaje_diferencia
from app.conciliacion.repository import ConciliacionRepository
from app.conciliacion.schemas import (
    AjustarStockConteoRespuesta,
    ConteoFisicoListado,
    ConteoFisicoRespuesta,
    DetalleConteoRespuesta,
    ItemConteoInput,
)
from app.core.dinero import redondear
from app.core.excepciones import ConflictoError, DatosInvalidosError, NoEncontradoError
from app.inventario.models import MovimientoInventario, Producto, TipoMovimiento
from app.usuarios.models import Usuario


class ConciliacionService:
    """Orquestación del flujo de conciliación de inventario y semáforo (RF-27 al RF-29, F-04)."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = ConciliacionRepository(db)

    def _convertir_a_respuesta(self, conteo: ConteoFisico) -> ConteoFisicoRespuesta:
        detalles_resp: list[DetalleConteoRespuesta] = []
        for d in conteo.detalles:
            prod = d.producto
            cat_nombre = prod.categoria.nombre if prod and prod.categoria else "Sin categoría"
            detalles_resp.append(
                DetalleConteoRespuesta(
                    id=d.id,
                    producto_id=d.producto_id,
                    producto_sku=prod.sku if prod else "SKU",
                    producto_nombre=prod.nombre if prod else "Producto",
                    categoria_nombre=cat_nombre,
                    unidad=prod.unidad if prod else "unidad",
                    stock_sistema=d.stock_sistema,
                    stock_fisico=d.stock_fisico,
                    diferencia=d.diferencia,
                    porcentaje_diferencia=d.porcentaje_diferencia,
                    conforme=d.conforme,
                    ajustado=d.ajustado,
                )
            )

        return ConteoFisicoRespuesta(
            id=conteo.id,
            fecha=conteo.fecha,
            responsable_id=conteo.responsable_id,
            responsable_nombre=conteo.responsable.nombre if conteo.responsable else "Usuario",
            estado=conteo.estado,
            observaciones=conteo.observaciones,
            total_items=conteo.total_items,
            items_conformes=conteo.items_conformes,
            items_no_conformes=conteo.items_no_conformes,
            porcentaje_conformidad=conteo.porcentaje_conformidad,
            cerrado_en=conteo.cerrado_en,
            detalles=detalles_resp,
        )

    def iniciar_conteo(
        self, responsable: Usuario, observaciones: str | None = None
    ) -> ConteoFisicoRespuesta:
        """Inicia una sesión de conteo físico capturando el stock del sistema (RF-27, F-04)."""
        conteo = self.repo.crear_conteo(responsable.id, observaciones)

        bitacora = Bitacora(
            usuario_id=responsable.id,
            usuario_nombre=responsable.nombre,
            accion="INICIAR_CONTEO",
            entidad="conteo_fisico",
            entidad_id=str(conteo.id),
            detalle=f"Conteo físico iniciado con {conteo.total_items} productos capturados.",
            fecha=datetime.now(UTC),
        )
        self.db.add(bitacora)
        self.db.commit()

        conteo_cargado = self.repo.obtener_por_id(conteo.id)
        assert conteo_cargado is not None
        return self._convertir_a_respuesta(conteo_cargado)

    def obtener_conteo(self, conteo_id: int) -> ConteoFisicoRespuesta:
        """Obtiene un conteo por su ID con todos los detalles y cálculos."""
        conteo = self.repo.obtener_por_id(conteo_id)
        if not conteo:
            raise NoEncontradoError(f"No se encontró la sesión de conteo con ID {conteo_id}.")
        return self._convertir_a_respuesta(conteo)

    def listar_conteos(
        self, estado: str | None = None, limit: int = 50
    ) -> list[ConteoFisicoListado]:
        """Lista el historial de sesiones de conteo registradas."""
        items = self.repo.listar(estado=estado, limit=limit)
        return [
            ConteoFisicoListado(
                id=c.id,
                fecha=c.fecha,
                responsable_id=c.responsable_id,
                responsable_nombre=c.responsable.nombre if c.responsable else "Usuario",
                estado=c.estado,
                total_items=c.total_items,
                items_conformes=c.items_conformes,
                items_no_conformes=c.items_no_conformes,
                porcentaje_conformidad=c.porcentaje_conformidad,
                cerrado_en=c.cerrado_en,
            )
            for c in items
        ]

    def actualizar_conteos_fisicos(
        self, conteo_id: int, items: list[ItemConteoInput]
    ) -> ConteoFisicoRespuesta:
        """Guarda en borrador los valores de stock físico ingresados por el almacén (RN-08)."""
        conteo = self.repo.obtener_por_id(conteo_id)
        if not conteo:
            raise NoEncontradoError(f"No se encontró la sesión de conteo con ID {conteo_id}.")

        if conteo.estado == EstadoConteo.CERRADO.value:
            raise ConflictoError("No se pueden modificar las cantidades de un conteo cerrado.")

        mapa_items = {it.producto_id: it.stock_fisico for it in items}
        for detalle in conteo.detalles:
            if detalle.producto_id in mapa_items:
                fisico = mapa_items[detalle.producto_id]
                detalle.stock_fisico = fisico

        self.db.commit()
        conteo_actualizado = self.repo.obtener_por_id(conteo.id)
        assert conteo_actualizado is not None
        return self._convertir_a_respuesta(conteo_actualizado)

    def calcular_diferencias(self, conteo_id: int) -> ConteoFisicoRespuesta:
        """Aplica la fórmula RN-06 / RN-07 y genera el semáforo para cada producto evaluado."""
        conteo = self.repo.obtener_por_id(conteo_id)
        if not conteo:
            raise NoEncontradoError(f"No se encontró la sesión de conteo con ID {conteo_id}.")

        items_evaluados = 0
        items_conformes = 0

        for detalle in conteo.detalles:
            if detalle.stock_fisico is not None:
                resultado = calcular_porcentaje_diferencia(
                    stock_sistema=detalle.stock_sistema,
                    stock_fisico=detalle.stock_fisico,
                )
                detalle.diferencia = resultado.diferencia
                detalle.porcentaje_diferencia = resultado.porcentaje
                detalle.conforme = resultado.conforme

                items_evaluados += 1
                if resultado.conforme:
                    items_conformes += 1

        conteo.items_conformes = items_conformes
        conteo.items_no_conformes = items_evaluados - items_conformes

        if items_evaluados > 0:
            porcentaje_crudo = (Decimal(items_conformes) / Decimal(items_evaluados)) * Decimal(
                "100"
            )
            conteo.porcentaje_conformidad = redondear(porcentaje_crudo)
        else:
            conteo.porcentaje_conformidad = Decimal("0.00")

        self.db.commit()
        conteo_actualizado = self.repo.obtener_por_id(conteo.id)
        assert conteo_actualizado is not None
        return self._convertir_a_respuesta(conteo_actualizado)

    def cerrar_conteo(self, conteo_id: int, usuario: Usuario) -> ConteoFisicoRespuesta:
        """Cierra la sesión de conteo físico dejándola fija para auditoría (F-04)."""
        conteo = self.repo.obtener_por_id(conteo_id)
        if not conteo:
            raise NoEncontradoError(f"No se encontró la sesión de conteo con ID {conteo_id}.")

        if conteo.estado == EstadoConteo.CERRADO.value:
            return self._convertir_a_respuesta(conteo)

        # Si aún no se calcularon las diferencias, calculamos
        self.calcular_diferencias(conteo_id)

        conteo.estado = EstadoConteo.CERRADO.value
        conteo.cerrado_en = datetime.now(UTC)

        detalle_txt = (
            f"Conteo #{conteo.id} cerrado. Conformidad general: {conteo.porcentaje_conformidad}%."
        )
        bitacora = Bitacora(
            usuario_id=usuario.id,
            usuario_nombre=usuario.nombre,
            accion="CERRAR_CONTEO",
            entidad="conteo_fisico",
            entidad_id=str(conteo.id),
            detalle=detalle_txt,
            fecha=datetime.now(UTC),
        )
        self.db.add(bitacora)
        self.db.commit()

        conteo_actualizado = self.repo.obtener_por_id(conteo.id)
        assert conteo_actualizado is not None
        return self._convertir_a_respuesta(conteo_actualizado)

    def ajustar_stock_al_conteo(
        self,
        conteo_id: int,
        usuario: Usuario,
        motivo: str,
        producto_ids: list[int] | None = None,
    ) -> AjustarStockConteoRespuesta:
        """Ajusta el stock del sistema al valor del conteo físico (RF-29, solo Administrador)."""
        if not motivo or len(motivo.strip()) < 3:
            raise DatosInvalidosError(
                "Debe indicar un motivo obligatorio de al menos 3 caracteres para el ajuste."
            )

        conteo = self.repo.obtener_por_id(conteo_id)
        if not conteo:
            raise NoEncontradoError(f"No se encontró la sesión de conteo con ID {conteo_id}.")

        # Filtrar detalles a ajustar
        candidatos: list[DetalleConteo] = []
        for d in conteo.detalles:
            if d.stock_fisico is None or d.ajustado:
                continue

            if producto_ids is not None:
                if d.producto_id in producto_ids:
                    candidatos.append(d)
            else:
                # Si no se filtró por lista, ajustamos los no conformes
                if d.conforme is False:
                    candidatos.append(d)

        if not candidatos:
            raise ConflictoError(
                "No hay productos pendientes con conteo físico para realizar el ajuste de stock."
            )

        ajustados_count = 0
        now = datetime.now(UTC)

        # Transacción atómica de ajuste de stock
        for det in candidatos:
            stmt_prod = select(Producto).where(Producto.id == det.producto_id).with_for_update()
            prod = self.db.scalar(stmt_prod)
            if not prod:
                continue

            stock_nuevo = det.stock_fisico
            assert stock_nuevo is not None
            stock_anterior = prod.stock_actual
            diferencia_cant = stock_nuevo - stock_anterior

            movimiento = MovimientoInventario(
                producto_id=prod.id,
                tipo=TipoMovimiento.AJUSTE.value,
                cantidad=abs(diferencia_cant),
                stock_anterior=stock_anterior,
                stock_resultante=stock_nuevo,
                motivo=f"Ajuste por Conciliación #{conteo.id}: {motivo.strip()}",
                usuario_id=usuario.id,
                fecha=now,
            )
            self.db.add(movimiento)

            prod.stock_actual = stock_nuevo
            det.ajustado = True
            ajustados_count += 1

        detalle_ajuste = (
            f"Se ajustó el stock de {ajustados_count} productos al valor físico. "
            f"Motivo: {motivo.strip()}"
        )
        bitacora = Bitacora(
            usuario_id=usuario.id,
            usuario_nombre=usuario.nombre,
            accion="AJUSTE_CONCILIACION",
            entidad="conteo_fisico",
            entidad_id=str(conteo.id),
            detalle=detalle_ajuste,
            fecha=now,
        )
        self.db.add(bitacora)
        self.db.commit()

        return AjustarStockConteoRespuesta(
            conteo_id=conteo.id,
            productos_ajustados=ajustados_count,
            mensaje=f"Se ajustó con éxito el stock de {ajustados_count} productos en el sistema.",
        )
