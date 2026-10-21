---
name: pruebas-unitarias-pytest
description: >-
  Estándar para diseñar, escribir y documentar pruebas unitarias con pytest en el Sistema Textilería.
  Use this skill when writing or reviewing tests (pruebas unitarias, casos de prueba, cobertura,
  pytest, unittest.mock, matriz de casos de prueba) for the backend, especially the 4 critical
  functions of Phase 1: validar_producto, calcular_total_venta, descontar_stock,
  calcular_porcentaje_diferencia.
---

# Pruebas unitarias con pytest

Las pruebas de este proyecto son **un entregable académico**: además de pasar, deben demostrar técnica
(particiones de equivalencia, valores límite, casos de error) y dejar evidencia trazable a los requerimientos.

## 1. Qué se prueba en cada nivel

| Nivel | Carpeta | Qué prueba | Dependencias |
| --- | --- | --- | --- |
| Unitaria de reglas | `backend/tests/unit/` | Funciones puras de `app/<dominio>/reglas.py` | Ninguna (sin BD, sin FastAPI) |
| Unitaria de servicio | `backend/tests/unit/` | `service.py` con el repositorio simulado | `unittest.mock` (`Mock`, `patch`) |
| Integración | `backend/tests/integration/` | Endpoints con `TestClient` y BD SQLite temporal | FastAPI, SQLAlchemy |

Las 4 funciones de la Fase 1 son **unitarias de reglas**: se prueban llamando a la función real con entradas conocidas.

## 2. Diseño de casos (obligatorio por función)

Antes de escribir código de prueba, listar los casos aplicando estas técnicas:

1. **Partición de equivalencia válida:** al menos un caso típico que debe funcionar.
2. **Particiones inválidas:** un caso por cada tipo de entrada rechazada (vacío, cero, negativo, tipo incorrecto, fuera de rango).
3. **Valores límite:** el límite exacto, justo por debajo y justo por encima (ej.: descuento 10 / 10.01 con tope 10; diferencia 2.00 % / 2.01 %).
4. **Exactitud numérica:** casos con resultado conocido calculado a mano, incluido uno que pruebe el redondeo `ROUND_HALF_UP`.

El catálogo mínimo de casos por función está en [references/catalogo-casos.md](./references/catalogo-casos.md). Se puede ampliar, nunca recortar.

## 3. Convenciones de código

- **Archivo:** un archivo por función → `tests/unit/test_<funcion>.py`.
- **Nombre:** `test_<funcion>_<escenario>_<resultado_esperado>`, en español.
  Ej.: `test_descontar_stock_cantidad_mayor_al_stock_lanza_error`.
- **Docstring:** cada prueba indica su ID de caso, técnica y requerimiento:
  `"""CP-03-04 · Valor límite · RF-19: vender exactamente todo el stock deja 0."""`
- **Estructura AAA**, con comentarios `# Arrange`, `# Act`, `# Assert` cuando la prueba tenga más de 3 líneas.
- **Una idea por prueba.** Para variaciones de datos del mismo escenario, usar `@pytest.mark.parametrize` con `ids=` legibles.
- **Dinero:** siempre `Decimal("12.50")` (desde string). Comparar con `==` contra `Decimal`, nunca con `float` ni `pytest.approx`.
- **Errores:** `with pytest.raises(StockInsuficienteError, match="disponible"):`. Verificar también los atributos de la excepción si los tiene (ej.: `error.value.disponible == 10`).
- **Fixtures** en `tests/conftest.py` solo para datos reutilizados (ej.: `item_tela`, `items_venta_tipica`). Nada de lógica escondida en fixtures.
- **Marcadores:** `@pytest.mark.unitaria` / `@pytest.mark.integracion`, registrados en `pyproject.toml`.
- **Mocks** (solo para servicios): simular el repositorio, no las reglas. Verificar con `assert_called_once_with(...)` que el servicio llamó lo correcto.

Ejemplo de referencia:

```python
import pytest
from decimal import Decimal

from app.core.excepciones import StockInsuficienteError, DatosInvalidosError
from app.inventario.reglas import descontar_stock


@pytest.mark.unitaria
def test_descontar_stock_cantidad_valida_resta_del_stock():
    """CP-03-01 · Partición válida · RF-23: 10 en stock, se venden 3, quedan 7."""
    assert descontar_stock(stock_actual=10, cantidad=3) == 7


@pytest.mark.unitaria
def test_descontar_stock_cantidad_mayor_al_stock_lanza_error():
    """CP-03-05 · Valor límite superior · RF-19: pedir 11 con 10 en stock se rechaza."""
    with pytest.raises(StockInsuficienteError, match="disponible") as error:
        descontar_stock(stock_actual=10, cantidad=11)
    assert error.value.disponible == 10


@pytest.mark.unitaria
@pytest.mark.parametrize("cantidad", [0, -1, 2.5], ids=["cero", "negativa", "decimal"])
def test_descontar_stock_cantidad_invalida_lanza_error(cantidad):
    """CP-03-06 · Particiones inválidas · RN-05: la cantidad debe ser entero > 0."""
    with pytest.raises(DatosInvalidosError):
        descontar_stock(stock_actual=10, cantidad=cantidad)
```

## 4. Configuración en `pyproject.toml`

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-ra --strict-markers"
markers = [
  "unitaria: prueba unitaria sin dependencias externas",
  "integracion: prueba con API y base de datos",
]

[tool.coverage.run]
source = ["app"]
branch = true

[tool.coverage.report]
show_missing = true
skip_covered = false
```

## 5. Ejecución y evidencias

```powershell
# Desde backend/
uv run pytest tests/unit -v                                   # detalle por prueba
uv run pytest tests/unit --cov=app --cov-branch --cov-report=term-missing --cov-report=html
uv run pytest tests/unit -v --junitxml=../docs/evidencias/resultado-pruebas.xml
```

Evidencias que se guardan en `docs/evidencias/` al cerrar la Fase 1:
1. `salida-pytest.txt`: salida de `pytest -v` con todas las pruebas en PASSED.
2. `cobertura.txt`: salida de `--cov-report=term-missing`.
3. `resultado-pruebas.xml`: reporte JUnit.
4. `matriz-casos-prueba.md`: tabla con la [plantilla de matriz](./references/plantilla-matriz.md), con el resultado obtenido real.

## 6. Criterios de aceptación de la suite

- 100 % de pruebas pasan, sin `skip` ni `xfail` en las funciones críticas.
- Cobertura de líneas y ramas de `reglas.py` ≥ 90 % (el proyecto exige ≥ 70 % en servicios, RNF-18).
- Cada caso del catálogo existe como prueba y aparece en la matriz con su ID.
- Las pruebas corren en < 5 s y en cualquier orden (sin estado compartido).
