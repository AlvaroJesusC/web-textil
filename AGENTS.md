# Reglas del proyecto · Sistema de ventas e inventario Textilería

Prototipo académico (Calidad de Software · UCV 2026) que simula el sistema de una textilería en Lima,
evaluado con la norma ISO/IEC 25010. Stack: **FastAPI + pytest** (backend) y **React + TypeScript** (frontend).

## Reglas obligatorias

1. **Antes de cualquier tarea de desarrollo**, activar la skill `desarrollo-textileria` (`.agents/skills/desarrollo-textileria/SKILL.md`) y seguir su protocolo.
2. **Fuentes de verdad** (no inventar requerimientos fuera de ellas):
   - `docs/01-requerimientos.md`: qué hace el sistema (RF, RNF, reglas RN, modelo de datos).
   - `docs/02-flujos-y-pantallas.md`: permisos, flujos y comportamiento de cada pantalla.
   - `docs/03-plan-fases.md`: orden de trabajo y criterios de salida.
   - `docs/04-brief-diseno.md`: identidad visual (Frontend).
3. **PROHIBICIÓN ESTRICTA DE PRUEBAS UNITARIAS TEMPRANAS:**
   - **NO crear carpetas `tests/`, ni archivos `test_*.py`, ni ejecutar pytest durante las Fases 0, 1, 2 y 3.**
   - Construir primero el sistema funcional completo (backend endpoints, base de datos y frontend con sus pantallas).
   - La suite de pruebas unitarias formal (`tests/unit/`, matriz de casos de prueba y reporte de cobertura) se desarrolla **ÚNICA Y EXCLUSIVAMENTE en la Fase 4**, cuando el sistema ya esté completamente terminado y funcionando.
4. **Al terminar cada fase**, marcarla `[x]` en `docs/03-plan-fases.md` y actualizar el registro de avance.
5. **Skills auxiliares automáticas:** El agente activa la skill correspondiente según lo que el usuario pida (`fastapi-best-practices` para backend, `frontend-design` y `web-design-guidelines` para frontend, y `pruebas-unitarias-pytest` **SOLO** al llegar a la Fase 4).
6. **Ante ambigüedad, preguntar** al usuario en lugar de suponer. Si se toma un supuesto, documentarlo en `docs/01-requerimientos.md`.
7. **Idioma:** respuestas al usuario, textos de UI, mensajes de error, docstrings y nombres de dominio en **español**.
8. **Nunca** usar `float` para dinero ni poner lógica de negocio en routers o componentes de UI.
