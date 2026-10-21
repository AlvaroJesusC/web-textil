# Plantilla · Matriz de casos de prueba unitaria

Copiar a `docs/evidencias/matriz-casos-prueba.md` al cerrar la Fase 1 y llenar con los resultados **reales** de la ejecución.

```markdown
# Matriz de casos de prueba unitaria · Sistema Textilería

**Herramienta:** pytest X.Y · pytest-cov X.Y · Python 3.12
**Fecha de ejecución:** AAAA-MM-DD
**Resultado global:** NN pruebas · NN aprobadas · 0 fallidas · Cobertura de reglas: NN %

## Resumen por función

| Función | Requerimientos | Casos | Aprobados | Cobertura |
| --- | --- | :---: | :---: | :---: |
| validar_producto / estado_stock | RF-07, RF-10, RF-13 | 15 | 15 | 100 % |
| calcular_total_venta | RF-20, RF-21, RNF-03 | 14 | 14 | 100 % |
| descontar_stock | RF-19, RF-23 | 8 | 8 | 100 % |
| calcular_porcentaje_diferencia | RF-28, RNF-02 | 11 | 11 | 100 % |

## Detalle

| ID | Función | Técnica | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado | Prueba (pytest) |
| --- | --- | --- | --- | --- | --- | --- | :---: | --- |
| CP-02-02 | calcular_total_venta | Exactitud | Venta con 2 ítems y 10 % de descuento | 3×12.50, 2×4.90, desc 10 % | total 50.23 | total 50.23 | ✅ | `test_calcular_total_venta_varios_items_con_descuento_calcula_exacto` |
| … | | | | | | | | |

## Conclusión

Breve párrafo: % de casos aprobados frente al criterio RNF-01 (≥ 95 %), exactitud frente a RNF-03 y
cobertura frente a RNF-18 (≥ 70 %).
```
