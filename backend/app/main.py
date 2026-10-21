from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import app.auditoria.models  # noqa: F401
import app.conciliacion.models  # noqa: F401
from app.auth.router import router as auth_router
from app.conciliacion.router import router as conciliacion_router
from app.core.config import settings
from app.core.database import Base, engine
from app.core.excepciones import ErrorDeNegocio
from app.inventario.router import router as inventario_router
from app.reportes.router import router as reportes_router
from app.usuarios.router import router as usuarios_router
from app.ventas.router import router as ventas_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Crear tablas automáticamente en SQLite local si no existen
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description=(
        "API REST transaccional para el Sistema de Ventas e Inventario de una Textilería en Lima "
        "(Curso de Calidad de Software · UCV 2026)."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Configuración de CORS para conexión con Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Manejador centralizado para todas las excepciones de negocio
@app.exception_handler(ErrorDeNegocio)
def manejador_error_de_negocio(_request: Request, exc: ErrorDeNegocio) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detalle": exc.detalle,
            "codigo": exc.codigo,
            "campos": exc.campos,
        },
    )


# Manejador para errores de validación de esquemas Pydantic
@app.exception_handler(RequestValidationError)
def manejador_error_validacion_pydantic(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    campos_error = {}
    for err in exc.errors():
        loc = err.get("loc", [])
        campo = str(loc[-1]) if loc else "general"
        campos_error[campo] = err.get("msg", "Dato no válido")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detalle": "Error en el formato o tipo de los datos de entrada.",
            "codigo": "DATOS_INVALIDOS",
            "campos": campos_error,
        },
    )


# Registro de routers modulares
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(usuarios_router, prefix=settings.API_V1_PREFIX)
app.include_router(inventario_router, prefix=settings.API_V1_PREFIX)
app.include_router(ventas_router, prefix=settings.API_V1_PREFIX)
app.include_router(conciliacion_router, prefix=settings.API_V1_PREFIX)
app.include_router(reportes_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["Sistema"])
def root() -> dict[str, str]:
    return {
        "sistema": settings.APP_NAME,
        "version": "1.0.0",
        "estado": "operativo",
        "documentacion": "/docs",
    }


@app.get("/health", tags=["Sistema"])
def health() -> dict[str, str]:
    return {"status": "ok"}
