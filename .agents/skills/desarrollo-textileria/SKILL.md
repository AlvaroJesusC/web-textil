---
name: desarrollo-textileria
description: >-
  Playbook principal del Sistema de ventas e inventario de la textilería (FastAPI + React).
  Use this skill at the start of ANY development task in this project (crear, modificar, probar,
  revisar o continuar el sistema; "sigue con la fase", "implementa RF-xx", "haz la pantalla P-xx").
  Define el orden por fases, qué documento consultar, qué skill auxiliar activar y cuándo una tarea
  se considera terminada.
---

# Desarrollo del Sistema Textilería

Esta skill **manda** sobre las demás skills del proyecto. Las otras skills se usan **solo** cuando esta lo indica.

## 1. Documentos fuente (leer antes de programar)

| Documento | Qué responde | Cuándo leerlo |
| --- | --- | --- |
| [01-requerimientos.md](../../../docs/01-requerimientos.md) | **Qué** hace el sistema: RF, RNF, reglas de negocio RN, modelo de datos | Siempre que se implemente un RF/RNF |
| [02-flujos-y-pantallas.md](../../../docs/02-flujos-y-pantallas.md) | **Cómo** se comporta: permisos, flujos F-01 a F-05, pantallas P-01 a P-11 | Al hacer endpoints con lógica de flujo y al hacer pantallas |
| [03-plan-fases.md](../../../docs/03-plan-fases.md) | **En qué orden** se construye y criterios de salida | Al inicio de cada sesión de trabajo |
| [04-brief-diseno.md](../../../docs/04-brief-diseno.md) | Identidad visual y restricciones de UI | Solo en Fase 3 en adelante |

No se inventan requerimientos. Si algo no está en los documentos o es ambiguo, **se pregunta al usuario** antes de decidir.

## 2. Protocolo de trabajo (obligatorio en cada tarea)

1. **Ubicarse:** abrir `docs/03-plan-fases.md`, identificar la fase actual (la primera con tareas `[ ]` o `[~]`) y la siguiente tarea pendiente.
2. **No saltar fases:** no se empieza una fase si la anterior no cumple su criterio de salida. Si el usuario pide algo de una fase futura, avisarle qué falta antes y preguntar si quiere adelantarlo.
3. **Leer los requerimientos** de esa tarea (IDs RF/RNF/RN) en `docs/01` y, si aplica, el flujo o la pantalla en `docs/02`.
4. **Activar la skill auxiliar** que corresponda (tabla de la sección 3).
5. **Implementar** la tarea mínima completa (código + pruebas), no a medias.
6. **Verificar** con los comandos de la sección 5. Si algo falla, se corrige antes de seguir.
7. **Registrar:** marcar la tarea `[x]` en `docs/03-plan-fases.md` y agregar una fila al "Registro de avance" con fecha y resultado.
8. **Reportar** al usuario: qué se hizo, qué RF cubre, resultado de pruebas y cuál es la siguiente tarea.

## 3. Mapa de skills por fase

| Fase | Skills a activar | Para qué |
| :---: | --- | --- |
| 0 | `fastapi-best-practices` | Estructura de carpetas backend, `pyproject.toml`, Ruff |
| 1 | `fastapi-best-practices` | Backend funcional: API REST, SQLAlchemy, Auth, Inventario y Ventas transaccionales |
| 2 | `frontend-design` → `web-design-guidelines` | Frontend funcional: Identidad visual propia, vistas de Login, Inventario y Caja de Ventas |
| 3 | `fastapi-best-practices` + `web-design-guidelines` | Conciliación de stock (semáforo) y Reportes de ventas (backend + UI) |
| 4 🎯 | `pruebas-unitarias-pytest` | **Fase de pruebas unitarias**: suite formal con pytest de las 4 funciones críticas, matriz de casos de prueba y reporte de cobertura HTML para la entrega universitaria |
| 5 | `web-design-guidelines` | Despliegue con Docker, métricas de calidad y evidencias finales |

> [!CAUTION]
> **PROHIBICIÓN ESTRICTA:**
> Durante las Fases 0, 1, 2 y 3 está **terminantemente prohibido** crear la carpeta `tests/`, crear archivos `test_*.py` o ejecutar comandos de pruebas (`pytest`).
> Primero se programa y se valida el sistema funcional (que corra y se pueda usar). La carpeta `tests/` y los casos de prueba unitarios se crean **únicamente al llegar a la Fase 4**.

## 4. Decisiones técnicas fijas

- **Monorepo:** `backend/` (Python) y `frontend/` (React) en la raíz; documentación en `docs/`.
- **Backend:** Python ≥ 3.12 con `uv`, FastAPI, Pydantic v2, SQLAlchemy 2.0 (**síncrono**, `Session`), Alembic, PyJWT, BCrypt. Calidad: `pytest`, `pytest-cov`, `ruff`.
- **BD:** SQLite en desarrollo (Docker no está instalado); código compatible con PostgreSQL 16, que se activa en la Fase 5.
- **Frontend:** React 18 + TypeScript (Vite), Tailwind, shadcn/ui (**con tema propio**), Lucide, React Router, TanStack Query, React Hook Form + Zod, Recharts.
- **Dinero:** siempre `Decimal` en Python, con 2 decimales y `ROUND_HALF_UP` (RN-01). En la API se serializa como string decimal. En el frontend nunca se calcula el total definitivo: lo calcula el servidor.
- **Idioma:**
  - Español para dominio, reglas, mensajes al usuario, nombres de pruebas, docstrings y textos de la UI (`calcular_total_venta`, `StockInsuficienteError`).
  - Inglés para piezas técnicas estándar del framework (`router.py`, `service.py`, `repository.py`, `models.py`, `schemas.py`).
- **Capas (RNF-17):** `router` (controlador) → `service` (orquesta y maneja la transacción) → `repository` (acceso a BD). Las reglas puras viven en `reglas.py` y **no importan** BD ni FastAPI.
- **Seguridad:** el permiso por rol se valida en el servidor con una dependencia (RNF-24). Contraseñas con BCrypt (RNF-22). Nunca se registran contraseñas ni tokens en logs.

## 5. Verificación (Definition of Done)

Una tarea está terminada solo si se cumple **todo** lo siguiente:

```powershell
# Desde backend/
uv run ruff check .                 # sin errores
uv run ruff format --check .        # formato correcto
uv run pytest                       # 100 % de pruebas pasan
uv run pytest --cov=app --cov-report=term-missing   # cobertura según la fase

# Desde frontend/ (Fase 3+)
npm run build                       # compila sin errores de TypeScript
npm run lint                        # sin errores
```

Además:
- La tarea cubre sus RF/RNF y respeta las reglas RN asociadas.
- Hay pruebas nuevas para la lógica nueva (mínimo un caso válido, uno inválido y uno de valor límite).
- Los mensajes de error al usuario están en español y dicen qué pasó y cómo corregirlo.
- `docs/03-plan-fases.md` está actualizado.

## 6. Prohibiciones

- No usar `float` para dinero ni porcentajes de negocio.
- No poner lógica de negocio en `router.py` ni en componentes de React.
- No descontar stock fuera de una transacción ni sin bloquear la fila del producto.
- No eliminar ni debilitar una prueba para que "pase". Si una prueba falla, se corrige el código o se confirma con el usuario que la regla cambió (y se actualiza `docs/01`).
- No agregar funcionalidades fuera del alcance (SUNAT, pagos reales, producción, compras completas).
- No usar el tema por defecto de shadcn/ui ni las señales de diseño genérico listadas en `docs/04-brief-diseno.md`.
