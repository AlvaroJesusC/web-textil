from typing import Any


class ErrorDeNegocio(Exception):
    """Clase base para todos los errores de dominio y reglas del sistema.

    rnf-17: las reglas puras lanzan estas excepciones sin depender de HTTP/FastAPI.
    """

    codigo: str = "ERROR_NEGOCIO"
    status_code: int = 400

    def __init__(
        self,
        detalle: str,
        codigo: str | None = None,
        campos: dict[str, Any] | None = None,
        status_code: int | None = None,
    ):
        super().__init__(detalle)
        self.detalle = detalle
        if codigo:
            self.codigo = codigo
        if status_code:
            self.status_code = status_code
        self.campos = campos or {}


class DatosInvalidosError(ErrorDeNegocio):
    """Datos de entrada no cumplen las reglas de negocio (422)."""

    codigo = "DATOS_INVALIDOS"
    status_code = 422


class NoEncontradoError(ErrorDeNegocio):
    """El recurso solicitado no existe (404)."""

    codigo = "NO_ENCONTRADO"
    status_code = 404


class ConflictoError(ErrorDeNegocio):
    """Violación de unicidad o conflicto de estado (409)."""

    codigo = "CONFLICTO"
    status_code = 409


class StockInsuficienteError(ErrorDeNegocio):
    """Stock insuficiente para la cantidad requerida (409) (RF-19, RN-05)."""

    codigo = "STOCK_INSUFICIENTE"
    status_code = 409

    def __init__(
        self,
        producto_nombre: str,
        disponible: int,
        solicitado: int,
        sku: str | None = None,
    ):
        detalle = (
            f"Solo hay {disponible} unidades disponibles de '{producto_nombre}' "
            f"(se solicitaron {solicitado})."
        )
        super().__init__(
            detalle=detalle,
            codigo=self.codigo,
            campos={
                "producto": producto_nombre,
                "sku": sku,
                "disponible": disponible,
                "solicitado": solicitado,
            },
        )
        self.producto_nombre = producto_nombre
        self.disponible = disponible
        self.solicitado = solicitado
        self.sku = sku


class DescuentoNoPermitidoError(ErrorDeNegocio):
    """El porcentaje de descuento solicitado supera el límite autorizado (422) (RF-20, RN-03)."""

    codigo = "DESCUENTO_NO_PERMITIDO"
    status_code = 422

    def __init__(self, porcentaje: str | float, maximo_permitido: str | float):
        detalle = (
            f"El descuento del {porcentaje}% supera el tope máximo "
            f"permitido del {maximo_permitido}%."
        )
        super().__init__(
            detalle=detalle,
            codigo=self.codigo,
            campos={"porcentaje": str(porcentaje), "maximo_permitido": str(maximo_permitido)},
        )
        self.porcentaje = porcentaje
        self.maximo_permitido = maximo_permitido


class PermisoDenegadoError(ErrorDeNegocio):
    """El rol del usuario no tiene permisos para esta acción (403) (RNF-24)."""

    codigo = "PERMISO_DENEGADO"
    status_code = 403


class CredencialesInvalidasError(ErrorDeNegocio):
    """Usuario o contraseña incorrectos (401) (RF-01)."""

    codigo = "CREDENCIALES_INVALIDAS"
    status_code = 401


class CuentaBloqueadaError(ErrorDeNegocio):
    """La cuenta ha sido bloqueada temporalmente por reiterados intentos fallidos (403) (RF-06)."""

    codigo = "CUENTA_BLOQUEADA"
    status_code = 403
