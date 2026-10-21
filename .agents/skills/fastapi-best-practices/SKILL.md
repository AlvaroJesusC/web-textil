---
name: fastapi-best-practices
description: >-
  Estructura del proyecto y buenas prácticas de código del Sistema Textilería: backend FastAPI
  (capas router/service/repository, reglas puras, Pydantic v2, SQLAlchemy 2.0, transacciones, JWT)
  y convenciones del frontend React + TypeScript. Use this skill when creating folders or files,
  writing backend endpoints, models, schemas, services, migrations, or organizing frontend code.
  Adapted from zhanymkanov/fastapi-best-practices.
---

# Estructura y buenas prácticas

Adaptación de [fastapi-best-practices](https://github.com/zhanymkanov/fastapi-best-practices) para este proyecto.
La guía original completa está en [references/fastapi-best-practices-original.md](./references/fastapi-best-practices-original.md): consultarla para temas no cubiertos aquí. **Si hay conflicto, manda este archivo.**

## 1. Estructura del repositorio

```text
sistema-textileria/
├── AGENTS.md                      # Regla siempre activa del proyecto
├── docs/                          # Requerimientos, flujos, plan, brief, evidencias/
├── backend/
│   ├── pyproject.toml             # Dependencias + config de pytest, coverage y ruff
│   ├── alembic.ini
│   ├── alembic/                   # Migraciones
│   ├── app/
│   │   ├── main.py                # Crea la app, registra routers, middlewares y manejador de errores
│   │   ├── core/
│   │   │   ├── config.py          # Settings (pydantic-settings) desde variables de entorno
│   │   │   ├── database.py        # engine, SessionLocal, Base con naming convention, get_db
│   │   │   ├── security.py        # hash BCrypt, crear/verificar JWT
│   │   │   ├── dependencies.py    # usuario_actual, requiere_rol(*roles)
│   │   │   ├── excepciones.py     # ErrorDeNegocio y subclases
│   │   │   └── dinero.py          # redondear() con ROUND_HALF_UP
│   │   ├── auth/                  # login, logout, me
│   │   ├── usuarios/
│   │   ├── inventario/            # productos, categorías, movimientos, kardex
│   │   ├── ventas/
│   │   ├── conciliacion/          # conteos físicos
│   │   ├── reportes/
│   │   └── auditoria/             # bitácora
│   └── tests/
│       ├── conftest.py
│       ├── unit/                  # reglas y servicios (sin BD real)
│       └── integration/           # endpoints con TestClient
└── frontend/                      # ver sección 7
```

### Archivos de cada dominio (`app/<dominio>/`)

| Archivo | Capa (RNF-17) | Contiene | Puede importar |
| --- | --- | --- | --- |
| `reglas.py` | Dominio | Funciones **puras** de negocio y dataclasses (ej.: `calcular_total_venta`) | Solo `core/excepciones`, `core/dinero`, stdlib |
| `schemas.py` | Contrato API | Modelos Pydantic de entrada/salida | Pydantic |
| `models.py` | Persistencia | Modelos ORM SQLAlchemy | `core/database` |
| `repository.py` | Repositorio | Consultas a BD; recibe `Session`; **sin reglas de negocio** | `models` |
| `service.py` | Servicio | Orquesta: valida con `reglas`, usa `repository`, maneja la **transacción** y la bitácora | `reglas`, `repository`, otros `service` |
| `router.py` | Controlador | Endpoints: recibe, llama al servicio, devuelve el schema. **Sin lógica** | `service`, `schemas`, `core/dependencies` |
| `dependencies.py` | (opcional) | Dependencias propias del dominio (ej.: `producto_existente`) | `service` |

Regla de oro: **las dependencias apuntan hacia adentro** (`router → service → reglas/repository`). `reglas.py` nunca importa SQLAlchemy ni FastAPI.

## 2. Decisiones que se apartan de la guía original

| Tema | Guía original | Este proyecto | Por qué |
| --- | --- | --- | --- |
| SQLAlchemy | Async (`AsyncSession`) | **Síncrono** (`Session`) con rutas `def` | Más simple para el equipo; FastAPI corre las rutas `def` en un threadpool, suficiente para 30 usuarios (RNF-05). Transacciones y `with_for_update()` más directas. |
| Carpeta raíz | `src/` | `app/` | Convención común en proyectos FastAPI y más corta en imports. |
| Nombres | Inglés | Dominio en español, piezas técnicas en inglés | Trazabilidad con los requerimientos en español. |
| BD de desarrollo | PostgreSQL | SQLite (dev) → PostgreSQL 16 (Fase 5) | Docker no está instalado aún. |

## 3. Reglas del backend

### Pydantic v2
- `model_config = ConfigDict(from_attributes=True)` en schemas de salida que se crean desde ORM.
- Usar validadores nativos (`Field(gt=0)`, `Field(min_length=1)`, `condecimal`/`Annotated[Decimal, Field(max_digits=12, decimal_places=2)]`) para validación de **forma**. La validación de **negocio** vive en `reglas.py` (para que sea probable unitariamente).
- `.model_dump()`, nunca `.dict()`. Nada de APIs de Pydantic v1.
- Montos de dinero en la respuesta: `Decimal` serializado como string (`"50.23"`).
- Schemas separados por intención: `ProductoCrear`, `ProductoActualizar`, `ProductoRespuesta`, `ProductoListado`.

### Dependencias
- Siempre con `Annotated`: `db: Annotated[Session, Depends(get_db)]`.
- Alias reutilizables en `core/dependencies.py`: `SesionBD`, `UsuarioActual`.
- Permisos por rol con una dependencia: `dependencies=[Depends(requiere_rol(Rol.ADMINISTRADOR, Rol.ALMACENERO))]` → 403 si no corresponde (RNF-24).

### Transacciones (RF-23, RNF-16)
- El **servicio** abre y cierra la transacción: `with db.begin():` (o commit/rollback explícito en un único punto).
- Para descontar stock: leer el producto con `select(Producto).where(...).with_for_update()`, aplicar `descontar_stock()` y guardar dentro de la misma transacción que la venta y sus movimientos.
- Una excepción dentro de la transacción ⇒ rollback completo. Nunca capturar y silenciar la excepción a mitad de la operación.

### Errores
- Las reglas lanzan subclases de `ErrorDeNegocio` (`DatosInvalidosError`, `StockInsuficienteError`, `DescuentoNoPermitidoError`, `ConflictoError`, `NoEncontradoError`, `PermisoDenegadoError`).
- Un único manejador en `main.py` las convierte en JSON: `{"detalle": "Solo hay 10 disponibles de TEL-001", "codigo": "STOCK_INSUFICIENTE", "campos": {...}}`.
- Mapeo: datos → 422 · no encontrado → 404 · stock/conflicto/SKU duplicado → 409 · permiso → 403.
- Nunca devolver trazas internas ni mensajes en inglés al usuario.

### Base de datos
- `Base` con `MetaData(naming_convention=...)` para nombres de índices y constraints predecibles (ver guía original).
- Tablas en singular snake_case (`producto`, `detalle_venta`). Fechas con zona horaria (`DateTime(timezone=True)`), guardadas en UTC.
- Índices en: `producto.sku` (único), `producto.nombre`, `venta.fecha`, `venta.vendedor_id`, `movimiento_inventario.producto_id`.
- Listados paginados (20 por página, RNF-06): respuesta `{"items": [...], "total": N, "pagina": p, "por_pagina": 20}`.
- Todo cambio de esquema pasa por Alembic, con nombre descriptivo: `alembic revision --autogenerate -m "crea_tablas_ventas"`.

### API y documentación (RNF-20)
- Prefijos por dominio y tags en español: `APIRouter(prefix="/productos", tags=["Inventario"])`.
- Cada endpoint con `summary`, `response_model` y `responses` de error documentados → Swagger útil para el profesor.
- Configuración solo por variables de entorno (`.env` local, `.env.example` versionado). Nunca secretos en el código.

### Estilo
- `ruff` como linter y formateador (reglas `E, F, I, B, UP, SIM`), línea de 100.
- Tipado en todas las firmas públicas. `StrEnum` para roles, estados y métodos de pago.
- Docstrings en español en funciones de `reglas.py` y `service.py`, indicando el RF/RN que implementan.

## 4. Configuración base de `pyproject.toml`

```toml
[project]
name = "textileria-backend"
requires-python = ">=3.12"

[tool.ruff]
line-length = 100
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP", "SIM"]
```

(La configuración de pytest y coverage está en la skill `pruebas-unitarias-pytest`.)

## 5. Comandos

```powershell
cd backend
uv sync                                   # instala dependencias
uv run uvicorn app.main:app --reload      # API en http://127.0.0.1:8000/docs
uv run alembic upgrade head               # aplica migraciones
uv run ruff check . --fix; uv run ruff format .
uv run pytest
```

## 6. Antipatrones prohibidos

- Lógica de negocio en `router.py` o en `repository.py`.
- `float` para dinero. `session.commit()` disperso en varios lugares de una misma operación.
- Consultas con SQL concatenado (usar siempre el ORM o parámetros; RNF-25).
- Devolver modelos ORM directamente sin `response_model`.
- Exponer `contraseña_hash` en cualquier schema de salida.
- Llamadas bloqueantes dentro de rutas `async def` (en este proyecto las rutas son `def`).

## 7. Convenciones del frontend (React + TypeScript)

```text
frontend/src/
├── main.tsx · App.tsx
├── app/                 # router.tsx (rutas protegidas por rol), providers.tsx (QueryClient, tema)
├── components/
│   ├── ui/              # componentes shadcn/ui (personalizados con los tokens propios)
│   └── layout/          # Sidebar, Header, PageHeader, EmptyState, ConfirmDialog
├── features/            # un folder por módulo: auth, inventario, ventas, conciliacion, reportes, usuarios, auditoria
│   └── ventas/
│       ├── api.ts       # llamadas HTTP del módulo
│       ├── hooks.ts     # useQuery/useMutation (TanStack Query)
│       ├── schemas.ts   # validaciones Zod de formularios
│       ├── components/  # piezas de la pantalla (Carrito, ResumenVenta…)
│       └── pages/       # RegistrarVentaPage.tsx (P-05)…
├── lib/                 # api-client.ts, formato.ts (moneda S/, fechas), auth.ts
├── types/               # tipos compartidos que reflejan los schemas de la API
└── styles/              # globals.css con los tokens de diseño
```

- TypeScript estricto (`"strict": true`), sin `any`.
- Estado del servidor solo con TanStack Query; nada de copiar datos de la API a estados globales.
- Formularios con React Hook Form + Zod; los mensajes de validación coinciden con los del backend.
- Formato de moneda centralizado en `lib/formato.ts` (`Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" })`).
- Los componentes de página no hacen `fetch` directo: usan los hooks de su `feature`.
- La identidad visual y la revisión de UI se rigen por las skills `frontend-design` y `web-design-guidelines` (Fase 3).
