# Sistema de ventas e inventario · Textilería

Prototipo del sistema de información de una textilería en Lima, desarrollado para el curso de
**Calidad de Software** (Universidad César Vallejo, Ate 2026) y evaluado con la norma **ISO/IEC 25010:2023**.

## Módulos

Usuarios y acceso · Inventario · Ventas · Reportes y conciliación de stock · Auditoría.

## Stack

| Capa | Tecnología |
| --- | --- |
| Backend | Python 3.12+ · FastAPI · Pydantic v2 · SQLAlchemy 2.0 · Alembic · JWT + BCrypt |
| Pruebas | pytest · pytest-cov · unittest.mock |
| Frontend | React 18 · TypeScript · Vite · Tailwind · shadcn/ui · TanStack Query · Recharts |
| Base de datos | SQLite (desarrollo) · PostgreSQL 16 (despliegue con Docker Compose) |

## Documentación

| Documento | Contenido |
| --- | --- |
| [01-requerimientos.md](docs/01-requerimientos.md) | Requerimientos funcionales, no funcionales, reglas de negocio y modelo de datos |
| [02-flujos-y-pantallas.md](docs/02-flujos-y-pantallas.md) | Roles y permisos, flujos de negocio y comportamiento de las pantallas P-01 a P-11 |
| [03-plan-fases.md](docs/03-plan-fases.md) | Plan de desarrollo por fases, tareas y avance |
| [04-brief-diseno.md](docs/04-brief-diseno.md) | Brief de diseño UI/UX |

## Skills del agente (`.agents/skills/`)

| Skill | Origen | Uso |
| --- | --- | --- |
| `desarrollo-textileria` | Propia | Playbook principal: fases, protocolo y Definition of Done |
| `pruebas-unitarias-pytest` | Propia | Diseño y documentación de pruebas unitarias |
| `fastapi-best-practices` | Adaptada de [zhanymkanov/fastapi-best-practices](https://github.com/zhanymkanov/fastapi-best-practices) | Estructura y buenas prácticas backend/frontend |
| `frontend-design` | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/frontend-design) | Identidad visual propia, evita el diseño genérico |
| `web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines) | Auditoría de accesibilidad y calidad de UI |

## Cómo ejecutar

### Backend

```powershell
cd backend
uv sync                                        # Instalar dependencias
uv run python -m app.db_seed                  # Inicializar BD y cargar datos semilla
uv run uvicorn app.main:app --reload           # Servidor en http://127.0.0.1:8000
# Documentación interactiva Swagger: http://127.0.0.1:8000/docs
```

### Pruebas y verificación de código

```powershell
cd backend
uv run ruff check .                            # Verificación de linter
uv run ruff format --check .                   # Verificación de formato
uv run pytest                                  # Ejecutar suite de pruebas
uv run pytest --cov=app --cov-report=term-missing # Reporte de cobertura
```

