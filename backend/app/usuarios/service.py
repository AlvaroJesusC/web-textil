from sqlalchemy.orm import Session

from app.core.excepciones import ConflictoError, DatosInvalidosError, NoEncontradoError
from app.core.security import hashear_contrasena
from app.usuarios.models import EstadoUsuario, RolUsuario, Usuario
from app.usuarios.repository import UsuarioRepository
from app.usuarios.schemas import UsuarioActualizar, UsuarioCrear, UsuarioRespuesta


class UsuarioService:
    """Orquestación y lógica de negocio para usuarios (RF-04, RF-05)."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = UsuarioRepository(db)

    def listar_usuarios(
        self,
        skip: int = 0,
        limit: int = 20,
        rol: RolUsuario | None = None,
        estado: EstadoUsuario | None = None,
    ) -> tuple[list[UsuarioRespuesta], int]:
        items, total = self.repo.listar(skip=skip, limit=limit, rol=rol, estado=estado)
        return [UsuarioRespuesta.model_validate(u) for u in items], total

    def obtener_por_id(self, usuario_id: int) -> UsuarioRespuesta:
        usuario = self.repo.obtener_por_id(usuario_id)
        if not usuario:
            raise NoEncontradoError(f"No se encontró el usuario con ID {usuario_id}.")
        return UsuarioRespuesta.model_validate(usuario)

    def crear_usuario(self, datos: UsuarioCrear) -> UsuarioRespuesta:
        if self.repo.obtener_por_usuario(datos.usuario.strip()):
            raise ConflictoError(
                f"El nombre de usuario '{datos.usuario}' ya se encuentra registrado."
            )

        if len(datos.contrasena) < 8:
            raise DatosInvalidosError("La contraseña debe tener al menos 8 caracteres.")

        usuario = Usuario(
            nombre=datos.nombre.strip(),
            usuario=datos.usuario.strip().lower(),
            contrasena_hash=hashear_contrasena(datos.contrasena),
            rol=datos.rol.value,
            estado=EstadoUsuario.ACTIVO.value,
            debe_cambiar_clave=True,
        )
        self.repo.crear(usuario)
        self.db.commit()
        self.db.refresh(usuario)
        return UsuarioRespuesta.model_validate(usuario)

    def actualizar_usuario(self, usuario_id: int, datos: UsuarioActualizar) -> UsuarioRespuesta:
        usuario = self.repo.obtener_por_id(usuario_id)
        if not usuario:
            raise NoEncontradoError(f"No se encontró el usuario con ID {usuario_id}.")

        if datos.nombre is not None:
            usuario.nombre = datos.nombre.strip()
        if datos.rol is not None:
            usuario.rol = datos.rol.value
        if datos.estado is not None:
            usuario.estado = datos.estado.value

        self.db.commit()
        self.db.refresh(usuario)
        return UsuarioRespuesta.model_validate(usuario)

    def restablecer_contrasena(self, usuario_id: int, nueva_clave_temporal: str) -> None:
        usuario = self.repo.obtener_por_id(usuario_id)
        if not usuario:
            raise NoEncontradoError(f"No se encontró el usuario con ID {usuario_id}.")

        if len(nueva_clave_temporal) < 8:
            raise DatosInvalidosError("La clave temporal debe tener al menos 8 caracteres.")

        usuario.contrasena_hash = hashear_contrasena(nueva_clave_temporal)
        usuario.debe_cambiar_clave = True
        usuario.intentos_fallidos = 0
        usuario.bloqueado_hasta = None
        self.db.commit()
