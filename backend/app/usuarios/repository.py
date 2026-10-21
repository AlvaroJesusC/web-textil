from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.usuarios.models import EstadoUsuario, RolUsuario, Usuario


class UsuarioRepository:
    """Acceso a datos para la entidad Usuario (RNF-17)."""

    def __init__(self, db: Session):
        self.db = db

    def obtener_por_id(self, usuario_id: int) -> Usuario | None:
        return self.db.get(Usuario, usuario_id)

    def obtener_por_usuario(self, nombre_usuario: str) -> Usuario | None:
        stmt = select(Usuario).where(Usuario.usuario == nombre_usuario)
        return self.db.scalar(stmt)

    def listar(
        self,
        skip: int = 0,
        limit: int = 20,
        rol: RolUsuario | None = None,
        estado: EstadoUsuario | None = None,
    ) -> tuple[list[Usuario], int]:
        query = select(Usuario)
        if rol:
            query = query.where(Usuario.rol == rol.value)
        if estado:
            query = query.where(Usuario.estado == estado.value)

        total_stmt = select(func.count()).select_from(query.subquery())
        total = self.db.scalar(total_stmt) or 0

        items_stmt = query.order_by(Usuario.nombre.asc()).offset(skip).limit(limit)
        items = list(self.db.scalars(items_stmt).all())
        return items, total

    def crear(self, usuario: Usuario) -> Usuario:
        self.db.add(usuario)
        self.db.flush()
        return usuario
