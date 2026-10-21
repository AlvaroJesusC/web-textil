# Backend · Sistema de Ventas e Inventario Textilería

API REST desarrollada con **FastAPI**, **SQLAlchemy 2.0** y validación rigurosa con **Pydantic v2**.

## Requisitos previos

- Python ≥ 3.12 (recomendado 3.12, 3.13 o 3.14)
- [uv](https://docs.astral.sh/uv/) instalado

## Instalación y puesta en marcha

```powershell
# Instalar dependencias
uv sync

# Crear base de datos local y cargar datos semilla iniciales
uv run python -m app.db_seed

# Levantar el servidor en desarrollo
uv run uvicorn app.main:app --reload
```

- Documentación Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Documentación ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

## Credenciales semilla por defecto

| Rol | Usuario | Contraseña |
| --- | --- | --- |
| Administrador | `admin` | `Admin123!` |
| Vendedor | `vendedor1` | `Vendedor123!` |
| Almacenero | `almacen1` | `Almacen123!` |
| Gerente | `gerente1` | `Gerente123!` |

## Calidad y pruebas

```powershell
uv run ruff check .
uv run ruff format --check .
uv run pytest
uv run pytest --cov=app --cov-report=term-missing
```
