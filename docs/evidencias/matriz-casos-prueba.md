# Matriz de casos de prueba unitaria y aseguramiento de calidad · Sistema Textilería

**Curso:** Calidad de Software · UCV 2026  
**Herramientas de evaluación:** `pytest 9.1.1` · `pytest-cov 7.1.0` · `Python 3.14.3`  
**Fecha de ejecución:** 2026-10-21  
**Resultado global:** 111 pruebas ejecutadas · 111 aprobadas (100 %) · 0 fallidas · 0 omitidas  
**Cobertura de reglas de negocio:** 100 % (Líneas y ramas)  
**Cobertura general de la aplicación:** 76 % (Supera el umbral RNF-18 de ≥ 70 %)  

---

## 1. Resumen por función crítica y módulos

| Función / Módulo | Requerimientos | Casos ejecutados | Aprobados | % Éxito | Cobertura |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **`validar_producto` / `estado_stock`** | RF-07, RF-10, RF-13 · RN-09, RN-10 | 25 | 25 | 100 % | **100 %** |
| **`calcular_total_venta`** | RF-20, RF-21 · RNF-03 · RN-01 a RN-04 | 22 | 22 | 100 % | **100 %** |
| **`descontar_stock`** | RF-19, RF-23 · RN-05 | 16 | 16 | 100 % | **100 %** |
| **`calcular_porcentaje_diferencia`** | RF-28 · RNF-02 · RN-06 a RN-08 | 18 | 18 | 100 % | **100 %** |
| **Integración: Autenticación y JWT** | RF-01 a RF-03 · RNF-22 a RNF-24 | 5 | 5 | 100 % | 88 % (Router) |
| **Integración: Inventario y Movimientos** | RF-07, 08, 10-13 | 5 | 5 | 100 % | 78 % (Router) |
| **Integración: Ventas Transaccionales ACID** | RF-17 a RF-26 · RNF-16 | 5 | 5 | 100 % | 83 % (Servicio) |
| **Integración: Conciliación de Stock (Semáforo)** | RF-27 a RF-30 | 3 | 3 | 100 % | 81 % (Servicio) |
| **Integración: Reportes Gerenciales y KPIs** | RF-31, RF-32 | 7 | 7 | 100 % | 100 % (Router) / 80 % (Servicio) |
| **Integración: Gestión de Usuarios** | RF-04, RF-05 · RNF-24 | 5 | 5 | 100 % | 93 % (Router) / 73 % (Servicio) |
| **TOTAL GENERAL** | **RF-01 a RF-32 · RNF-01 a RNF-28** | **111** | **111** | **100 %** | **76 %** |

---

## 2. Detalle de casos de prueba de las 4 funciones críticas

### 2.1 Función 1: `validar_producto` y `estado_stock` (`app/inventario/reglas.py`)

| ID | Técnica | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado | Prueba (pytest) |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **CP-01-01** | Partición válida | Producto con todos los datos correctos | `sku="TEL-001", nombre="Tela jersey algodón", precio=12.50, stock=40, stock_minimo=5` | `{}` (sin errores) | `{}` | ✅ | `test_validar_producto_datos_completos_es_valido` |
| **CP-01-02** | Partición inválida | Nombre vacío | `nombre=""` | Clave `"nombre"` en errores | `"nombre"` detectado | ✅ | `test_validar_producto_nombre_vacio_genera_error` |
| **CP-01-03** | Partición inválida | Nombre solo con espacios en blanco | `nombre="   "` | Clave `"nombre"` en errores | `"nombre"` detectado | ✅ | `test_validar_producto_nombre_solo_espacios_genera_error` |
| **CP-01-04** | Partición inválida | SKU vacío | `sku=""` | Clave `"sku"` en errores | `"sku"` detectado | ✅ | `test_validar_producto_sku_vacio_genera_error` |
| **CP-01-05** | Valor límite | Precio cero | `precio=0.00` | Clave `"precio"` en errores | `"precio"` detectado | ✅ | `test_validar_producto_precio_cero_genera_error` |
| **CP-01-06** | Valor límite | Precio mínimo positivo permitido | `precio=0.01` | `{}` (válido) | `{}` | ✅ | `test_validar_producto_precio_minimo_positivo_es_valido` |
| **CP-01-07** | Partición inválida | Precio negativo | `precio=-5.00` | Clave `"precio"` en errores | `"precio"` detectado | ✅ | `test_validar_producto_precio_negativo_genera_error` |
| **CP-01-08** | Valor límite | Stock inicial en cero | `stock=0` | `{}` (válido) | `{}` | ✅ | `test_validar_producto_stock_cero_es_valido` |
| **CP-01-09** | Valor límite | Stock negativo rechazado | `stock=-1` | Clave `"stock"` en errores | `"stock"` detectado | ✅ | `test_validar_producto_stock_negativo_genera_error` |
| **CP-01-10** | Partición inválida | Stock mínimo negativo | `stock_minimo=-1` | Clave `"stock_minimo"` | `"stock_minimo"` detectado | ✅ | `test_validar_producto_stock_minimo_negativo_genera_error` |
| **CP-01-11** | Múltiples errores | Retorno simultáneo de todos los campos con falla | `sku="", nombre="", precio=0.00, stock=-1` | Claves `sku`, `nombre`, `precio`, `stock` | Las 4 claves retornadas | ✅ | `test_validar_producto_multiples_errores_reporta_todos` |
| **CP-01-12** | Estado stock | Stock agotado | `stock=0, stock_minimo=5, activo=True` | `EstadoStock.AGOTADO` | `agotado` | ✅ | `test_estado_stock_cero_es_agotado` |
| **CP-01-13** | Estado stock límite | Stock en el umbral mínimo | `stock=5, stock_minimo=5, activo=True` | `EstadoStock.BAJO` | `bajo` | ✅ | `test_estado_stock_limite_minimo_es_bajo` |
| **CP-01-14** | Estado stock límite | Stock por encima del mínimo | `stock=6, stock_minimo=5, activo=True` | `EstadoStock.NORMAL` | `normal` | ✅ | `test_estado_stock_sobre_minimo_es_normal` |
| **CP-01-15** | Estado stock prioridad | Producto desactivado | `stock=10, stock_minimo=5, activo=False` | `EstadoStock.INACTIVO` | `inactivo` | ✅ | `test_estado_stock_inactivo_tiene_prioridad` |
| **CP-01-16** | Conversión tipos | Precio provisto como string numérico o float | `precio="15.50"` y `precio=15.50` | Aceptado como válido | Aceptado | ✅ | `test_validar_producto_precio_conversion_desde_float_o_str_valido` |
| **CP-01-17** | Partición inválida | Precio con texto no numérico | `precio="invalido"` | Clave `"precio"` en errores | `"precio"` detectado | ✅ | `test_validar_producto_precio_no_numerico_genera_error` |
| **CP-01-18** | Partición inválida | Stock con tipos no enteros estrictos | `stock="10"`, `10.5`, `True`, `False` (4 variaciones) | Clave `"stock"` en errores | `"stock"` detectado en las 4 | ✅ | `test_validar_producto_stock_no_entero_genera_error` |
| **CP-01-19** | Partición inválida | Stock mínimo con tipos no enteros estrictos | `stock_minimo="5"`, `5.5`, `True`, `False` (4 variaciones) | Clave `"stock_minimo"` | `"stock_minimo"` detectado en las 4 | ✅ | `test_validar_producto_stock_minimo_no_entero_genera_error` |

---

### 2.2 Función 2: `calcular_total_venta` (`app/ventas/reglas.py`)

| ID | Técnica | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado | Prueba (pytest) |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **CP-02-01** | Partición válida | Venta simple sin descuento | `[2 × 10.00]`, desc 0 % | subtotal 20.00, desc 0.00, base 20.00, IGV 3.60, total 23.60 | Total 23.60 exacto | ✅ | `test_calcular_total_venta_particion_valida` |
| **CP-02-02** | Exactitud comercial | Venta múltiple con descuento del 10 % | `[3 × 12.50, 2 × 4.90]`, desc 10 % | subtotal 47.30, desc 4.73, base 42.57, IGV 7.66, total 50.23 | Total 50.23 exacto | ✅ | `test_calcular_total_venta_exactitud_varios_items_con_descuento` |
| **CP-02-03** | Redondeo IGV | Redondeo HALF_UP sobre IGV (0.045 -> 0.05) | `[1 × 0.25]`, desc 0 % | IGV 0.05, total 0.30 | IGV 0.05, total 0.30 | ✅ | `test_calcular_total_venta_redondeo_igv_half_up` |
| **CP-02-04** | Redondeo desc | Redondeo HALF_UP en descuento (0.005 -> 0.01) | `[1 × 0.50]`, desc 1 % | desc 0.01, base 0.49, IGV 0.09, total 0.58 | Total 0.58 exacto | ✅ | `test_calcular_total_venta_redondeo_descuento_half_up` |
| **CP-02-05** | Exactitud comercial | Venta con 15 % de descuento | `[1 × 33.35]`, desc 15 %, tope 100 % | subtotal 33.35, desc 5.00, base 28.35, IGV 5.10, total 33.45 | Total 33.45 exacto | ✅ | `test_calcular_total_venta_exactitud_con_descuento_15` |
| **CP-02-06** | Valor límite | Descuento total del 100 % | `[2 × 50.00]`, desc 100 % | subtotal 100.00, desc 100.00, total 0.00 | Total 0.00 exacto | ✅ | `test_calcular_total_venta_limite_descuento_100` |
| **CP-02-07** | Valor límite (tope) | Descuento en el límite exacto del tope | desc 10.00 %, tope 10.00 % | Operación permitida | Permite y calcula desc 10.00 | ✅ | `test_calcular_total_venta_tope_exacto_se_acepta` |
| **CP-02-08** | Límite superior tope | Descuento excede tope del rol en 0.01 % | desc 10.01 %, tope 10.00 % | `DescuentoNoPermitidoError` | Excepción con tope 10 | ✅ | `test_calcular_total_venta_tope_excedido_lanza_error` |
| **CP-02-09** | Partición inválida | Descuento negativo | desc -1 % | `DatosInvalidosError` | Error de rango | ✅ | `test_calcular_total_venta_descuento_negativo_lanza_error` |
| **CP-02-10** | Partición inválida | Descuento superior al 100 % | desc 100.01 % | `DatosInvalidosError` | Error de rango | ✅ | `test_calcular_total_venta_descuento_mayor_a_100_lanza_error` |
| **CP-02-11** | Partición inválida | Carrito de venta vacío | `items=[]` | `DatosInvalidosError` | Error de lista vacía | ✅ | `test_calcular_total_venta_items_vacio_lanza_error` |
| **CP-02-12** | Partición inválida | Cantidad del ítem inválida | cantidad 0 y cantidad -1 (2 variaciones) | `DatosInvalidosError` | Error en ambas | ✅ | `test_calcular_total_venta_cantidad_invalida_lanza_error` |
| **CP-02-13** | Partición inválida | Precio unitario inválido | precio 0.00 y precio -1.00 (2 variaciones) | `DatosInvalidosError` | Error en ambas | ✅ | `test_calcular_total_venta_precio_invalido_lanza_error` |
| **CP-02-14** | Tipo de datos | Estricta precisión Decimal (exponente -2) | Venta típica válida | Todos los campos son `Decimal` con exponente `-2` | Verificado en 5 campos | ✅ | `test_calcular_total_venta_todos_los_montos_son_decimal_con_dos_decimales` |
| **CP-02-15** | Conversión tipos | Descuento en entero o string numérico | `descuento_pct=10` y `"10.50"` | Conversión y cálculo exitoso | Calculado exactamente | ✅ | `test_calcular_total_venta_descuento_no_decimal_convierte_correctamente` |
| **CP-02-16** | Partición inválida | Descuento con valor no numérico | `descuento_pct="diez_porciento"` | `DatosInvalidosError` | Error descriptivo | ✅ | `test_calcular_total_venta_descuento_no_numerico_lanza_error` |
| **CP-02-17** | Conversión tipos | Tope de descuento como entero | `tope_descuento_pct=10` | Conversión y cálculo exitoso | Operación permitida | ✅ | `test_calcular_total_venta_tope_no_decimal_convierte_correctamente` |
| **CP-02-18** | Partición inválida | Tope con texto no numérico | `tope_descuento_pct="tope_invalido"` | `DatosInvalidosError` | Error descriptivo | ✅ | `test_calcular_total_venta_tope_no_numerico_lanza_error` |
| **CP-02-19** | Conversión tipos | Precio unitario como float | `precio_unitario=25.50` | Conversión segura a Decimal | Subtotal 51.00 | ✅ | `test_calcular_total_venta_precio_unitario_no_decimal_convierte_correctamente` |
| **CP-02-20** | Partición inválida | Precio unitario no numérico | `precio_unitario="caro"` | `DatosInvalidosError` | Error descriptivo | ✅ | `test_calcular_total_venta_precio_unitario_no_numerico_lanza_error` |

---

### 2.3 Función 3: `descontar_stock` (`app/inventario/reglas.py`)

| ID | Técnica | Descripción | Entrada (stock_actual, cantidad) | Resultado esperado | Resultado obtenido | Estado | Prueba (pytest) |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **CP-03-01** | Partición válida | Venta normal con stock suficiente | (10, 3) | 7 | 7 | ✅ | `test_descontar_stock_particion_valida` |
| **CP-03-02** | Valor límite | Descuento mínimo de 1 unidad | (10, 1) | 9 | 9 | ✅ | `test_descontar_stock_limite_inferior` |
| **CP-03-03** | Valor límite | Descuento de casi todo el stock | (10, 9) | 1 | 1 | ✅ | `test_descontar_stock_limite_casi_todo` |
| **CP-03-04** | Valor límite | Venta exacta de todo el stock disponible | (10, 10) | 0 (nunca negativo) | 0 | ✅ | `test_descontar_stock_limite_todo_el_stock` |
| **CP-03-05** | Límite superior | Solicitud de 1 unidad más del stock disponible | (10, 11) | `StockInsuficienteError` (disponible=10, solicitado=11) | Excepción con stock real | ✅ | `test_descontar_stock_cantidad_mayor_lanza_error` |
| **CP-03-06** | Partición inválida | Cantidad a descontar no entera o menor/igual a cero | (10, 0), (10, -1), (10, 2.5) (3 variaciones) | `DatosInvalidosError` | Error en las 3 variaciones | ✅ | `test_descontar_stock_cantidad_invalida_lanza_error` |
| **CP-03-07** | Stock agotado | Intento de venta de producto con stock 0 | (0, 1) | `StockInsuficienteError` (disponible=0) | Excepción con disponible 0 | ✅ | `test_descontar_stock_agotado_lanza_error` |
| **CP-03-08** | Calidad de error | Mensaje claro en español para el usuario (RF-19) | (10, 15, "Tela Algodón Pima", "TEL-001") | Mensaje contiene "10", "disponible" y "Tela Algodón Pima" | Información clara para el cajero | ✅ | `test_descontar_stock_mensaje_claro_incluye_disponible_y_nombre` |
| **CP-03-09** | Partición inválida | Stock actual inválido o corrupto | `stock_actual` en -1, -10, 10.5, "10", True, False (6 variaciones) | `DatosInvalidosError` | Error en las 6 variaciones | ✅ | `test_descontar_stock_stock_actual_invalido_lanza_error` |

---

### 2.4 Función 4: `calcular_porcentaje_diferencia` (`app/conciliacion/reglas.py`)

| ID | Técnica | Descripción | Entrada (sistema, físico) | Resultado esperado | Resultado obtenido | Estado | Prueba (pytest) |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **CP-04-01** | Partición válida | Conteo físico coincide exactamente con sistema | (100, 100) | diferencia 0, 0.00 %, conforme = True | Conforme (0.00 %) | ✅ | `test_calcular_diferencia_exacta_sin_diferencias` |
| **CP-04-02** | Valor límite | Sobrante en el límite exacto del umbral de 2.00 % | (102, 100) | diferencia +2, 2.00 %, conforme = True | Conforme (2.00 %) | ✅ | `test_calcular_diferencia_sobrante_limite_2_porciento` |
| **CP-04-03** | Valor límite | Faltante en el límite exacto del umbral de 2.00 % | (98, 100) | diferencia -2, 2.00 %, conforme = True | Conforme (2.00 %) | ✅ | `test_calcular_diferencia_faltante_limite_2_porciento` |
| **CP-04-04** | Límite superior | Diferencia excede umbral por 0.01 % | (10201, 10000) | 2.01 %, conforme = False | No conforme (2.01 %) | ✅ | `test_calcular_diferencia_justo_sobre_el_limite` |
| **CP-04-05** | Partición inválida | Diferencia significativa (3.00 %) | (103, 100) | diferencia +3, 3.00 %, conforme = False | No conforme (3.00 %) | ✅ | `test_calcular_diferencia_particion_no_conforme` |
| **CP-04-06** | Exactitud y redondeo | Redondeo HALF_UP sobre porcentaje periódico | (100, 97) | 3.0927 % -> 3.09 %, conforme = False | No conforme (3.09 %) | ✅ | `test_calcular_diferencia_exactitud_con_redondeo` |
| **CP-04-07** | Conforme no exacto | Margen aceptable no entero | (50, 51) | 1.96 %, conforme = True | Conforme (1.96 %) | ✅ | `test_calcular_diferencia_conforme_no_exacto` |
| **CP-04-08** | Límite por redondeo | Redondeo que rescata conformidad (2.0004 -> 2.00 %) | (5099, 4999) | 2.00 %, conforme = True | Conforme (2.00 %) | ✅ | `test_calcular_diferencia_limite_por_redondeo_half_up` |
| **CP-04-09** | División por cero | Ambos inventarios en cero (sin existencias) | (0, 0) | 0.00 %, conforme = True | Conforme (0.00 %) | ✅ | `test_calcular_diferencia_ambos_cero` |
| **CP-04-10** | División por cero | Stock en sistema pero cero en físico | (5, 0) | 100.00 %, conforme = False | No conforme (100.00 %) | ✅ | `test_calcular_diferencia_fisico_cero_sistema_positivo` |
| **CP-04-11** | Particiones inválidas | Valores negativos, decimales, booleanos o strings (8 variaciones) | (-1, 100), (100, -1), (10.5, 100), (100, 10.5), (True, 100), (100, False), ("100", 100), (100, "100") | `DatosInvalidosError` | Error en las 8 variaciones | ✅ | `test_calcular_diferencia_particiones_invalidas_lanza_error` |

---

## 3. Pruebas de integración del flujo de negocio

| Módulo | Escenario probado | Requerimiento / Norma | Resultado |
| :--- | :--- | :--- | :---: |
| **Autenticación** | Login exitoso devuelve token JWT y datos de sesión | RF-01, RNF-23 | ✅ Aprobado |
| **Autenticación** | Credenciales inválidas rechazan con código 401 | RF-02, RNF-22 | ✅ Aprobado |
| **Autenticación** | Bloqueo automático de cuenta tras 5 intentos fallidos consecutivos | RF-03, RNF-25 | ✅ Aprobado |
| **Autenticación** | Endpoint `/auth/me` con y sin token | RNF-23, RNF-24 | ✅ Aprobado |
| **Inventario** | Listado paginado de catálogo con SKU y stock | RF-07, RF-10 | ✅ Aprobado |
| **Inventario** | Creación de producto por Almacenero | RF-07, RF-08 | ✅ Aprobado |
| **Inventario** | Bloqueo 403 Forbidden a Vendedor al intentar crear producto | RNF-24 | ✅ Aprobado |
| **Inventario** | Ingreso de stock por orden de compra con registro de movimiento | RF-11, RF-12 | ✅ Aprobado |
| **Inventario** | Ajuste manual de stock con motivo y auditoría | RF-13 | ✅ Aprobado |
| **Ventas ACID** | Venta transaccional: descuento de stock, cálculo de subtotal, IGV y total | RF-17 a RF-25, RNF-16 | ✅ Aprobado |
| **Ventas ACID** | Rollback total ante stock insuficiente (el inventario no cambia) | RF-19, RNF-16 | ✅ Aprobado |
| **Ventas ACID** | Vendedor limitado a tope máximo de 10 % de descuento (422) | RF-20, RN-03 | ✅ Aprobado |
| **Ventas ACID** | Administrador autorizado a otorgar descuentos superiores | RF-20 | ✅ Aprobado |
| **Ventas ACID** | Anulación de venta restaura el stock original en la base de datos | RF-26, F-05 | ✅ Aprobado |
| **Conciliación** | Apertura de sesión con captura inmutable de inventario | RF-27, P-07 | ✅ Aprobado |
| **Conciliación** | Control de acceso: Vendedor denegado para conciliación (403) | RNF-24 | ✅ Aprobado |
| **Conciliación** | Flujo completo: captura -> conteo -> semáforo (2 %) -> cierre -> ajuste admin | RF-27 a RF-30 | ✅ Aprobado |
| **Reportes** | Resumen de KPIs gerenciales (ingresos, tickets, alertas) | RF-30, RF-32 | ✅ Aprobado |
| **Reportes** | Agrupación temporal de ingresos por día para gráficos Recharts | RF-30 | ✅ Aprobado |
| **Reportes** | Ranking de productos textiles más vendidos por rotación | RF-31 | ✅ Aprobado |
| **Reportes** | Desglose por vendedor y por medios de pago | RF-30 | ✅ Aprobado |
| **Reportes** | Listado de alertas para productos con stock bajo y agotados | RF-31 | ✅ Aprobado |
| **Reportes** | Protección de reportes gerenciales ante accesos no autorizados | RNF-24 | ✅ Aprobado |
| **Usuarios** | Listado, creación y actualización de perfiles por el Administrador | RF-04 | ✅ Aprobado |
| **Usuarios** | Restablecimiento de contraseña temporal | RF-05 | ✅ Aprobado |
| **Usuarios** | Denegación de acceso al módulo de usuarios a roles operativos | RNF-24 | ✅ Aprobado |

---

## 4. Conclusiones y evaluación ISO/IEC 25010

1. **Adecuación Funcional y Completitud (RNF-01):**  
   Se ejecutaron 111 pruebas automatizadas con una tasa de éxito del **100 % (111/111)**, superando ampliamente el criterio de aceptación del 95 % estipulado en la norma.

2. **Exactitud Numérica y Financiera (RNF-03 · RN-01):**  
   Todas las operaciones de cálculo de totales, subtotales, descuentos, IGV (18 %) y porcentajes de desviación de conteos físicos emplean la clase `Decimal` con redondeo estricto `ROUND_HALF_UP` a dos cifras decimales (`-2`). Ningún cálculo utiliza punto flotante binario (`float`), garantizando cero discrepancias contables.

3. **Mantenibilidad y Cobertura de Código (RNF-18):**  
   - Las 4 funciones críticas de reglas de negocio alcanzan el **100 % de cobertura de sentencias y ramas**.
   - Los servicios del backend alcanzan una cobertura promedio del **76 %**, satisfaciendo el requerimiento RNF-18 (≥ 70 %).
   - La suite completa ejecuta en **menos de 9 segundos** en entorno local con base de datos en memoria, garantizando retroalimentación ágil en pipelines de Integración Continua (CI/CD).
