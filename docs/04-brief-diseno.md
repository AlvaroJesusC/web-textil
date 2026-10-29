# 04 · Brief de diseño (UI/UX) · Identidad Visual Textil Moderna

> **Directiva obligatoria para todo el Frontend.**
> El sistema es un **ERP / Punto de Venta Textil moderno**: debe tener **vida, calidez y presencia visual** gracias a su paleta inspirada en tintes y algodón crudo, evitando tanto los banners publicitarios exagerados como el extremo opuesto de verse "gris, plano, cuadrado o triste".

---

## 1. Paleta de Colores Oficial (Obligatoria)

Se utiliza esta paleta de 4 pilares más semánticos, definida en variables CSS en `index.css` y aplicada en todos los componentes:

| Rol | Nombre Textil | HEX | Escala / Uso concreto en la interfaz |
| :--- | :--- | :---: | :--- |
| **Primary** | **Índigo Telar** | `#1B2A4A` | Sidebar principal (`bg-[#1B2A4A]`), textos de títulos principales, encabezados de tablas importantes y botones secundarios oscuros (`hover:bg-[#243861]`). |
| **Secondary** | **Terracota Teja** | `#D95D39` | **Color estrella de acción (CTA):** Botón principal `+ Nueva Venta` / `Confirmar Venta` (`bg-[#D95D39] hover:bg-[#C24D2B] text-white shadow-sm`), indicador activo en el Sidebar, badges de punto de venta. |
| **Tertiary** | **Azul Cobalto** | `#2452E8` | Acentos interactivos, íconos de tarjetas KPI (`bg-[#2452E8]/10 text-[#2452E8]`), enlaces de acción, anillos de foco (`focus:ring-[#2452E8]`), series principales en gráficos Recharts. |
| **Neutral** | **Algodón Crudo** | `#F9F8F5` | Lienzo de fondo general de la aplicación (`bg-[#F9F8F5]`). Permite que las tarjetas blancas (`#FFFFFF`) resalten con calidez y contraste natural sin verse frías ni hospitalarias. |
| **Superficie** | **Blanco Pima** | `#FFFFFF` | Fondo de tarjetas, tablas, barra superior y modales, con borde cálido suave (`border-[#E6E3DC]`). |
| **Éxito** | **Verde Tintorero** | `#15803D` | Fondo suave `#DCFCE7`, texto `#15803D`. Para "Caja Abierta", stock normal y conciliación conforme (≤ 2%). |
| **Alerta** | **Ámbar Cinta** | `#D97706` | Fondo suave `#FEF3C7`, texto `#B45309`. Para stock bajo y advertencias. |
| **Peligro** | **Rojo Carmesí** | `#DC2626` | Fondo suave `#FEE2E2`, texto `#B91C1C`. Para stock agotado, errores y conciliación no conforme (> 2%). |

---

## 2. Forma, Tipografía y Profundidad (Prohibido el aspecto "cuadrado y triste")

1. **Geometría moderna y amable (NO cajas cuadradas):**
   * **Tarjetas, paneles y tablas:** Usar `rounded-xl` (12px) o `rounded-2xl` (16px) con borde cálido `border border-[#E6E3DC]` y sombra suave `shadow-sm` (nunca `rounded-md` ni cajas sin sombra que parezcan wireframes planos).
   * **Botones e inputs:** Usar `rounded-lg` (8px-10px) con transiciones suaves (`transition-all duration-150`) y buen padding (`px-4 py-2.5`).
2. **Tipografía limpia con personalidad (`Plus Jakarta Sans` o `Inter` con `tabular-nums`):**
   * Importar en `index.css` la fuente Google Fonts **`Plus Jakarta Sans`** para títulos/cuerpo y **`JetBrains Mono`** para códigos.
   * **PROHIBIDO usar `font-mono` en números grandes de KPIs o títulos** (hace que los números grandes se vean toscos como consola antigua). Los montos grandes (`S/ 1,892.44`, `36 artículos`) usan la fuente principal en `font-bold tracking-tight tabular-nums`.
   * `font-mono` se reserva **únicamente** para códigos SKU (`TEL-005`, `HIL-001`), números de comprobante (`V-000028`) y atajos de teclado (`/`).
3. **Iconografía con color e intención:**
   * **Prohibido** poner todos los íconos en gris muerto (`bg-slate-100 text-slate-600`).
   * Cada tarjeta KPI y módulo lleva su acento cromático:
     * *Ventas Recientes:* ícono en azul cobalto (`bg-[#2452E8]/10 text-[#2452E8]`).
     * *Catálogo Activo:* ícono en índigo (`bg-[#1B2A4A]/10 text-[#1B2A4A]`).
     * *Stock Crítico:* ícono en terracota/ámbar (`bg-[#D95D39]/12 text-[#D95D39]`).
     * *Auditoría Física:* ícono en esmeralda (`bg-emerald-500/10 text-emerald-700`).

---

## 3. Reglas de Equilibrio (Profesional y con Vida, sin caer en Marketing Cliché)

* **Sin banners gigantes de anuncio**, pero **SÍ con una Barra de Mostrador con presencia:** En el Dashboard, la barra superior de operación puede tener un acento lateral en Terracota (`border-l-4 border-l-[#D95D39]`), fondo blanco puro, ícono con fondo `#1B2A4A` y el botón principal **`+ Registrar Venta (POS)` en color Terracota `#D95D39`** para darle energía inmediata a la pantalla.
* **Cero saturación de flechitas `→`**, pero enlaces con color `#2452E8` (`hover:underline font-medium`) para que se note claramente dónde hacer clic.
* **Precios y cifras alineados a la derecha** con `tabular-nums`.

---

## 4. Plan de Aplicación por Etapas (En todos los módulos)

### 🔹 Etapa 0: Base Global, Tipografía y Layout (`index.css`, `Sidebar.tsx`, `Header.tsx`)
* Cargar `Plus Jakarta Sans` y `JetBrains Mono` en `index.css`. Definir variables CSS con `#1B2A4A`, `#D95D39`, `#2452E8`, `#F9F8F5` y `#E6E3DC`.
* **Sidebar:** Fondo `#1B2A4A` (Índigo Telar profundo). Logo con acento Terracota `#D95D39`. Ítem activo del menú con fondo `bg-white/12`, texto blanco y barra lateral izquierda en `#D95D39`.
* **Header:** Fondo blanco cálido con borde `#E6E3DC`, botón principal `+ Nueva Venta` en Terracota `#D95D39` con `rounded-lg shadow-sm`.

### 🔹 Etapa 1: Dashboard con Vida y Jerarquía (`DashboardPage.tsx`)
* Fondo `#F9F8F5`.
* **Barra de Mostrador Activo:** `rounded-xl bg-white border border-[#E6E3DC] border-l-4 border-l-[#D95D39] shadow-sm`, botón primario en `#D95D39` y secundario en `#1B2A4A`.
* **4 Tarjetas KPI:** `rounded-xl bg-white border border-[#E6E3DC] shadow-sm hover:shadow-md transition-all`, cada una con su ícono coloreado (`#2452E8`, `#1B2A4A`, `#D95D39`, `#15803D`) y números grandes en `Plus Jakarta Sans` (`text-2xl font-bold text-[#1B2A4A] tabular-nums`).
* **Paneles inferiores (Últimas ventas y Stock crítico):** `rounded-xl`, encabezados claros con enlaces en `#2452E8`.

### 🔹 Etapa 2: Inventario de Telas y Modales (`InventarioPage.tsx` + Modales)
* Barra de filtros en tarjeta blanca `rounded-xl` con buscador estilizado (`focus:ring-2 focus:ring-[#2452E8]`) y botón `+ Nuevo Producto` en `#D95D39`.
* Tabla `rounded-xl shadow-sm` con encabezado en `#F2F0EA` (tono lino suave) y texto `#1B2A4A`.
* Filas con hover cálido (`hover:bg-[#F9F8F5]`), SKU en `font-mono text-xs font-semibold text-[#1B2A4A]` y precios alineados a la derecha.
* Modales (`ProductoFormModal`, `IngresoStockModal`, `AjusteStockModal`, `KardexModal`) con `rounded-2xl`, cabecera con ícono en `#1B2A4A` y botón de confirmación en `#D95D39` o `#2452E8`.

### 🔹 Etapa 3: Caja POS e Historial de Ventas (`RegistrarVentaPage.tsx` + `HistorialVentasPage.tsx`)
* **POS (P-05):** Tarjetas de productos con `rounded-xl`, borde activo `#2452E8` al pasar el cursor.
* **Ticket / Carrito de Venta:** Panel derecho destacado con cabecera en `#1B2A4A` (texto blanco), desglose limpio de Subtotal, Descuento e IGV (18%), total grande y botón **`Confirmar e Imprimir Venta` en `#D95D39` (`rounded-xl py-3.5 text-base font-bold shadow-md`)**.

### 🔹 Etapa 4: Conciliación de Stock Físico (`ConciliacionPage.tsx` + Modales)
* Tarjeta de progreso de conteo y semáforo visual (≤ 2% Verde `#15803D`, > 2% Rojo `#DC2626`) con `rounded-xl`.
* Inputs de conteo físico con foco en `#2452E8` y botón de cálculo/cierre con la paleta oficial.

### 🔹 Etapa 5: Reportes y Métricas (`ReportesPage.tsx`)
* Gráficos Recharts usando las series `#1B2A4A` (Índigo), `#D95D39` (Terracota) y `#2452E8` (Cobalto).
* Selector de fechas con pestañas activas en `#1B2A4A` y tarjetas analíticas `rounded-xl`.

### 🔹 Etapa 6: Login (`LoginPage.tsx`)
* Fondo en `#1B2A4A` con detalles sutiles o lienzo `#F9F8F5` dividido, tarjeta `rounded-2xl shadow-xl`, logo con acento `#D95D39` y botón de ingreso en `#D95D39`.
