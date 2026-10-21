# 01 · Requerimientos del sistema

> **Fuente oficial.** Este documento es la referencia de **qué** debe hacer el sistema y **con qué calidad**.
> Si un requerimiento no está aquí, no se implementa sin consultarlo antes con el usuario.
> El **orden** en que se construye cada requerimiento está en [03-plan-fases.md](./03-plan-fases.md).

**Proyecto:** Sistema de ventas e inventario para una textilería en Lima (prototipo)
**Contexto:** Curso de Calidad de Software · Universidad César Vallejo, Ate 2026
**Origen:** Simula el sistema de información evaluado en el informe *Evaluación de la Calidad del Software en base a la ISO/IEC 25010 en una Textilería en Lima 2026*, porque no se tiene acceso al software real de la empresa.

---

## 1. Alcance

**Módulos incluidos (5):** Usuarios y acceso · Inventario · Ventas · Reportes y conciliación de stock · Auditoría.

**Fuera del alcance (no implementar):**
- Facturación electrónica con SUNAT (el comprobante es **interno**).
- Módulo de producción de planta.
- Gestión completa de compras a proveedores (solo se registra el **ingreso** de stock).
- Pagos en línea reales.
- Aplicación móvil nativa (el diseño responsivo cubre el celular).

## 2. Actores

| Rol | Descripción |
| --- | --- |
| **Administrador** | Gestiona usuarios, anula ventas, ajusta stock y accede a todos los módulos. |
| **Vendedor** | Registra ventas y consulta el inventario. |
| **Almacenero** | Gestiona productos, ingresos de stock y conteos físicos. |
| **Gerente** | Consulta dashboard, historial y reportes (solo lectura). |

## 3. Convenciones

- **Prioridad Alta:** indispensable para el MVP · **Media:** deseable · **Baja:** opcional.
- **(\*)** = valor propuesto por el grupo; debe ajustarse con la empresa, como indica el informe.
- **Fase** = fase del [plan de desarrollo](./03-plan-fases.md) en la que se implementa.
- Las características de calidad siguen la norma **ISO/IEC 25010:2023**.

---

## 4. Requerimientos funcionales (RF)

### 4.1 Usuarios y acceso

| ID | Requerimiento | Prioridad | Fase |
| --- | --- | :---: | :---: |
| RF-01 | Iniciar sesión con usuario y contraseña. | Alta | 2 · 3 |
| RF-02 | Cerrar sesión manualmente y cerrarla automáticamente tras 15 minutos de inactividad. | Alta | 2 · 3 |
| RF-03 | Restringir el acceso a módulos y acciones según el rol (Administrador, Vendedor, Almacenero, Gerente). | Alta | 2 · 3 |
| RF-04 | El administrador crea, edita, activa y desactiva usuarios y les asigna un rol. | Alta | 2 · 4 |
| RF-05 | Cada usuario puede cambiar su contraseña; el administrador puede restablecerla. | Media | 4 |
| RF-06 | Bloquear temporalmente la cuenta (15 min) tras 5 intentos fallidos de inicio de sesión. | Media | 4 |

### 4.2 Inventario

| ID | Requerimiento | Prioridad | Fase |
| --- | --- | :---: | :---: |
| RF-07 | Registrar un producto validando: nombre obligatorio, precio > 0, stock ≥ 0 y código (SKU) único. | Alta | **1** · 2 · 3 |
| RF-08 | Editar los datos de un producto. | Alta | 2 · 3 |
| RF-09 | Desactivar un producto; no se elimina si tiene ventas asociadas. | Media | 4 |
| RF-10 | Listar, buscar y filtrar productos por nombre, código, categoría y estado de stock (normal, bajo, agotado, inactivo). | Alta | 2 · 3 |
| RF-11 | Registrar ingresos de stock indicando cantidad, proveedor, documento y fecha. | Alta | 2 · 3 |
| RF-12 | Ajustar el stock manualmente con motivo obligatorio (merma, error de conteo, etc.). | Alta | 2 · 3 |
| RF-13 | Definir un stock mínimo por producto y alertar cuando el stock lo alcance. | Alta | 2 · 3 |
| RF-14 | Mostrar el kardex de cada producto (ingresos, salidas, ajustes, anulaciones) con fecha, cantidad y usuario. | Media | 4 |
| RF-15 | Gestionar categorías de productos (telas, hilos, avíos, prendas terminadas). | Media | 2 (semilla) · 4 |
| RF-16 | Exportar el inventario a Excel o CSV. | Baja | 5 |

### 4.3 Ventas

| ID | Requerimiento | Prioridad | Fase |
| --- | --- | :---: | :---: |
| RF-17 | Buscar productos y agregarlos a un carrito de venta. | Alta | 2 · 3 |
| RF-18 | Modificar la cantidad de cada ítem y quitarlo del carrito. | Alta | 3 |
| RF-19 | Validar el stock disponible antes de confirmar y mostrar un mensaje claro con el producto y el stock restante. | Alta | **1** · 2 · 3 |
| RF-20 | Aplicar un descuento porcentual (0 a 100 %); el vendedor tiene un tope máximo configurable (\*10 %). | Media | **1** · 2 · 3 |
| RF-21 | Calcular automáticamente subtotal, descuento, IGV (18 %) y total, con dos decimales. | Alta | **1** · 2 · 3 |
| RF-22 | Registrar el método de pago (efectivo, Yape/Plin, transferencia, tarjeta) y, opcionalmente, el cliente. | Media | 2 · 3 |
| RF-23 | Al confirmar una venta, guardar la venta y descontar el stock en **una sola transacción** (todo o nada). | Alta | **1** · 2 |
| RF-24 | Generar un comprobante de venta interno en PDF (no es comprobante electrónico SUNAT). | Media | 4 |
| RF-25 | Consultar el historial de ventas filtrando por fecha, vendedor y método de pago. | Alta | 2 · 3 |
| RF-26 | El administrador puede anular una venta con motivo obligatorio; el stock se devuelve automáticamente. | Media | 4 |

> RF-20 y RF-22 son de prioridad Media, pero se construyen junto con la venta porque el flujo de P-05 los necesita (el método de pago es obligatorio para confirmar).

### 4.4 Reportes y conciliación de stock

| ID | Requerimiento | Prioridad | Fase |
| --- | --- | :---: | :---: |
| RF-27 | Iniciar un conteo físico que toma una captura del stock del sistema para compararlo. | Alta | 2 · 3 |
| RF-28 | Calcular el % de diferencia entre stock del sistema y conteo físico por producto y marcarlo con semáforo (verde ≤ 2 %, rojo > 2 %). | Alta | **1** · 2 · 3 |
| RF-29 | El administrador puede ajustar el stock al valor del conteo físico indicando un motivo. | Alta | 2 · 3 |
| RF-30 | Generar reportes de ventas por periodo, producto y vendedor, con gráficos y tablas. | Alta | 2 · 3 |
| RF-31 | Mostrar los productos más vendidos y los productos con stock bajo. | Media | 4 |
| RF-32 | Mostrar un dashboard con indicadores clave (ventas del día y del mes, stock bajo, últimas ventas). | Media | 4 |
| RF-33 | Exportar los reportes a PDF y Excel. | Media | 4 |

### 4.5 Auditoría

| ID | Requerimiento | Prioridad | Fase |
| --- | --- | :---: | :---: |
| RF-34 | Registrar en una bitácora quién realizó cada acción sensible (ventas, anulaciones, ajustes, cambios de usuarios), cuándo y sobre qué. | Media | 4 |
| RF-35 | El administrador puede consultar y filtrar la bitácora por usuario, acción y fecha. | Media | 4 |

---

## 5. Requerimientos no funcionales (RNF) · ISO/IEC 25010:2023

Cada RNF tiene un **criterio medible**; así se evalúa en el informe de calidad.

### 5.1 Adecuación funcional · prioridad alta

| ID | Requerimiento | Criterio de aceptación |
| --- | --- | --- |
| RNF-01 | Las funciones cumplen lo especificado. | ≥ 95 % de casos de prueba funcionales aprobados. |
| RNF-02 | El stock del sistema es consistente con la realidad. | Diferencia sistema vs. conteo físico ≤ 2 %. |
| RNF-03 | Los cálculos de totales, descuentos e IGV son exactos. | Cero diferencias en casos con valores conocidos (2 decimales). |

### 5.2 Eficiencia de desempeño · prioridad alta

| ID | Requerimiento | Criterio de aceptación |
| --- | --- | --- |
| RNF-04 | Operaciones críticas (buscar producto, confirmar venta, cargar inventario) responden rápido en hora pico. | ≤ 3 s en hora pico. |
| RNF-05 | Soportar usuarios simultáneos en hora pico. | \*30 usuarios concurrentes sin romper RNF-04 (JMeter). |
| RNF-06 | Listas y reportes paginados y con índices en BD. | \*Reporte de 12 meses ≤ 5 s; listas de 20 filas por página. |

### 5.3 Capacidad de interacción (usabilidad) · prioridad alta

| ID | Requerimiento | Criterio de aceptación |
| --- | --- | --- |
| RNF-07 | Interfaz intuitiva para el personal de ventas y almacén. | Puntaje SUS ≥ 68. |
| RNF-08 | Registrar una venta es rápido. | \*Venta de 1 producto en ≤ 5 clics y < 1 minuto. |
| RNF-09 | Prevenir errores del usuario. | Validación en línea, mensajes claros y confirmación en acciones destructivas. |
| RNF-10 | Diseño responsivo. | Uso correcto desde 360 px de ancho. |
| RNF-11 | Interfaz accesible. | \*Contraste y navegación por teclado según WCAG 2.2 AA. |
| RNF-12 | Interfaz en español y consistente. | Revisión con lista de verificación de diseño. |

### 5.4 Fiabilidad · prioridad alta

| ID | Requerimiento | Criterio de aceptación |
| --- | --- | --- |
| RNF-13 | Disponible en horario laboral. | Disponibilidad ≥ 99 %. |
| RNF-14 | Respaldos automáticos de la BD. | \*Respaldo diario con restauración verificada. |
| RNF-15 | Recuperación rápida tras una interrupción. | \*Tiempo de recuperación ≤ 1 hora. |
| RNF-16 | Operaciones de stock y ventas transaccionales (ACID); los errores no tumban el sistema. | Ninguna venta queda a medias en pruebas de fallo. |

### 5.5 Mantenibilidad · prioridad alta

| ID | Requerimiento | Criterio de aceptación |
| --- | --- | --- |
| RNF-17 | Arquitectura por capas (controlador, servicio, repositorio) y módulos independientes. | Revisión de estructura del proyecto. |
| RNF-18 | La lógica de negocio tiene pruebas unitarias. | \*Cobertura ≥ 70 % en la capa de servicios/reglas. |
| RNF-19 | Baja deuda técnica. | \*Sin bugs críticos ni vulnerabilidades en SonarQube; deuda < 5 %. |
| RNF-20 | Sistema documentado. | API documentada con OpenAPI (Swagger) y README de instalación. |
| RNF-21 | Incidencias corregidas a tiempo. | Corrección en < 3 días hábiles. |

### 5.6 Seguridad · prioridad media

| ID | Requerimiento | Criterio de aceptación |
| --- | --- | --- |
| RNF-22 | Contraseñas almacenadas cifradas. | Hash BCrypt; nunca en texto plano. |
| RNF-23 | Autenticación con tokens con expiración y comunicación cifrada. | JWT con expiración y HTTPS. |
| RNF-24 | El acceso por rol se valida en el servidor, no solo ocultando botones. | Petición no autorizada → error 403 (Postman). |
| RNF-25 | Resistir las vulnerabilidades más comunes. | \*Consultas parametrizadas, protección XSS y CSRF (OWASP Top 10). |

### 5.7 Compatibilidad y flexibilidad · prioridad media

| ID | Requerimiento | Criterio de aceptación |
| --- | --- | --- |
| RNF-26 | Funciona en navegadores comunes. | Últimas versiones de Chrome, Edge y Firefox. |
| RNF-27 | Exportación en formatos estándar. | .xlsx, .csv y .pdf abren sin errores. |
| RNF-28 | Instalable en cualquier equipo y compatible con múltiples bases de datos. | Configuración por variables de entorno (`DATABASE_URL` en `.env`); permite operar en desarrollo con SQLite local y conectarse sin modificar código a servicios externos como Supabase, PostgreSQL en la nube o MySQL. Despliegue listo para Docker Compose. |

---

## 6. Reglas de negocio (derivadas de los RF)

Estas reglas son la base de las **funciones puras** de la Fase 1 y de sus pruebas unitarias.

| ID | Regla | Origen |
| --- | --- | --- |
| RN-01 | **Dinero:** se usa `Decimal`, nunca `float`. Redondeo a 2 decimales con `ROUND_HALF_UP`. | RF-21, RNF-03 |
| RN-02 | **Cálculo de venta:** `subtotal = Σ(cantidad × precio_unitario)` → `descuento = subtotal × %desc / 100` → `base = subtotal − descuento` → `igv = base × 0.18` → `total = base + igv`. | RF-21 |
| RN-03 | **Descuento:** entre 0 y 100 %. Si el usuario es Vendedor, no puede superar el tope configurable (\*10 %). Fuera de rango → error. | RF-20 |
| RN-04 | **Ítems de venta:** cantidad entera > 0; precio unitario > 0; la venta debe tener al menos 1 ítem. | RF-17, RF-18 |
| RN-05 | **Descontar stock:** cantidad entera > 0 y ≤ stock actual. Si no, error indicando el stock disponible. El stock nunca queda negativo. | RF-19, RF-23 |
| RN-06 | **Diferencia de conteo:** `% = |stock_sistema − stock_fisico| / stock_fisico × 100`, redondeado a 2 decimales. Conforme (verde) si `% ≤ 2`, no conforme (rojo) si `% > 2`. | RF-28, RNF-02 |
| RN-07 | **Conteo con físico = 0:** si el sistema también es 0 → 0 % (conforme); si el sistema es > 0 → 100 % (no conforme). Evita la división entre cero. | RF-28 |
| RN-08 | **Conteo físico:** solo enteros ≥ 0; rechaza negativos y decimales. | P-07 |
| RN-09 | **Validar producto:** SKU obligatorio, nombre obligatorio (sin solo espacios), precio > 0, stock ≥ 0, stock mínimo ≥ 0. Devuelve **todos** los errores por campo, no solo el primero. La unicidad del SKU se valida en el servicio (necesita BD). | RF-07 |
| RN-10 | **Estado de stock:** `inactivo` si el producto está desactivado; `agotado` si stock = 0; `bajo` si stock ≤ stock mínimo; si no, `normal`. | RF-10, RF-13 |

> [!IMPORTANT]
> **Supuesto RN-02:** se asume que los precios de venta se registran **sin IGV** y que el IGV se suma al final, siguiendo el orden del RF-21 (subtotal → descuento → IGV → total). Si la empresa maneja precios con IGV incluido, solo cambia esta regla y sus pruebas.

---

## 7. Modelo de datos (resumen)

| Entidad | Atributos principales |
| --- | --- |
| Usuario | id, nombre, usuario, contraseña (hash), rol, estado, intentos fallidos, bloqueado_hasta, debe_cambiar_clave |
| Categoría | id, nombre |
| Producto | id, SKU, nombre, categoría, unidad (metro, cono, unidad, bolsa), precio, stock actual, stock mínimo, estado |
| MovimientoInventario | id, producto, tipo (ingreso, venta, ajuste, anulación), cantidad, stock_resultante, motivo, proveedor, documento, usuario, fecha |
| Venta | id, número, fecha, vendedor, cliente, método de pago, subtotal, descuento_pct, descuento, IGV, total, estado (confirmada, anulada), motivo_anulación |
| DetalleVenta | id, venta, producto, cantidad, precio unitario, importe |
| ConteoFisico | id, fecha, responsable, estado (borrador, cerrado) |
| DetalleConteo | id, conteo, producto, stock sistema (captura), stock físico, % diferencia, conforme |
| Bitácora | id, usuario, acción, entidad, entidad_id, detalle, fecha |

## 8. Trazabilidad con el informe

| Problema del informe | Requerimientos que lo atienden | Indicador |
| --- | --- | --- |
| Lentitud en horas de alta demanda | RNF-04, RNF-05, RNF-06 | Tiempo de respuesta en hora pico |
| Inconsistencias en los reportes de stock | RF-23, RF-27, RF-28, RF-29, RNF-02 | % diferencia sistema vs. físico |
| Interfaz poco intuitiva y errores de usuario | RF-19, RNF-07 a RNF-12, flujos de [02-flujos-y-pantallas.md](./02-flujos-y-pantallas.md) | Puntaje SUS y errores por semana |
| Interrupciones durante el procesamiento | RF-23, RNF-13 a RNF-16 | Disponibilidad y tiempo de recuperación |
| Deuda técnica y costos correctivos | RNF-17 a RNF-21 | Tiempo medio de corrección |
