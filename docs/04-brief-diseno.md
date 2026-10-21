# 04 · Brief de diseño (UI/UX)

> Este brief es la **entrada** de la skill `frontend-design` en la Fase 3.
> Su objetivo: que la interfaz se vea como **el sistema de esta textilería**, y no como una plantilla genérica hecha por IA.
> La sección "Decisión final" se completa en la tarea 3.1 y **se confirma con el usuario antes de programar pantallas**.

---

## 1. Sujeto, público y trabajo principal

| | |
| --- | --- |
| **Sujeto** | Una textilería en Lima que vende telas por metro, hilos en cono, avíos (botones, cierres, etiquetas) y prendas terminadas. |
| **Público** | Vendedores en mostrador (rápidos, con cola de clientes), almaceneros (cuentan rollos y conos), un administrador y un gerente que mira números. Personal no técnico; algunos usan el sistema desde tablet o celular. |
| **Trabajo principal** | Registrar ventas sin errores y en segundos, y saber **cuánto stock hay realmente**. |
| **Tono** | Herramienta de trabajo: clara, directa, confiable. No es una landing page ni un producto SaaS de marketing. |

## 2. Material del mundo textil (de dónde salen las decisiones visuales)

Las decisiones de color, tipografía y estructura deben salir de este vocabulario, sin caer en lo literal (nada de fondos con estampados de tela por todas partes):

- **Materiales:** rollos de tela apilados, conos de hilo de colores, carta de colores (muestrario), etiquetas de precio colgantes, cinta métrica, papel kraft de los paquetes.
- **Oficio:** la orilla de la tela (orillo), las costuras y pespuntes, la trama y la urdimbre (cuadrícula), el corte a medida.
- **Operación:** kardex, guía de remisión, conteo de inventario, mostrador, caja, Yape/Plin.
- **Unidades:** metro, cono, unidad, bolsa. Precios en soles (`S/`).

## 3. Restricciones funcionales del diseño

- **Densidad útil:** tablas de inventario y ventas legibles con muchas filas. Cifras tabulares (`tabular-nums`) alineadas a la derecha.
- **El semáforo de conciliación** (verde ≤ 2 %, rojo > 2 %) no puede depender solo del color: también lleva ícono o texto (accesibilidad, RNF-11).
- **Estados de stock** (normal, bajo, agotado, inactivo) distinguibles a simple vista y consistentes en todas las pantallas.
- **P-05 Registrar venta** es la pantalla estrella: la más cuidada, pensada para teclado y para tocar en tablet.
- Contraste WCAG 2.2 AA, foco de teclado visible, responsivo desde 360 px, `prefers-reduced-motion` respetado.
- Todo en español, en tono de oficina peruana: claro y sin tecnicismos ("Registrar ingreso", no "Crear movimiento de tipo IN").

## 4. Lo que NO queremos (señales de "diseño genérico de IA")

- Fuente Inter/Roboto por defecto, o el tema de shadcn/ui sin modificar.
- Degradados morado-azul, fondo crema con acento terracota, fondo casi negro con un acento neón.
- Todo cortado en tarjetas iguales con el mismo radio y la misma sombra gris.
- Etiquetas en MAYÚSCULAS con letra espaciada sobre cada título, números decorativos "01 / 02 / 03" que no indican una secuencia, flechas "→" en todos los botones.
- Animaciones de entrada en cada sección o efectos hover en cada tarjeta.
- Dashboard con "número grande + etiqueta pequeña + acento degradado" como única idea.

## 5. Proceso obligatorio (resumen de la skill `frontend-design`)

1. Proponer un **plan de tokens**: 4–6 colores con nombre y hex, tipografías y su rol, concepto de layout (con wireframe ASCII de P-05 y P-03) y 3–4 principios propios.
2. **Autocrítica:** comparar el plan con lo que saldría para "cualquier sistema de inventario". Lo que se parezca, se cambia, y se explica por qué.
3. Presentar el plan al usuario y esperar su confirmación.
4. Recién entonces, implementar los tokens y construir las pantallas.
5. Al terminar cada pantalla: revisar con `web-design-guidelines`.

## 6. Decisión final (Propuesta de tokens para Fase 2)

| Token CSS | Valor HEX | Uso / Semántica textil |
| --- | --- | --- |
| `--color-azul-telar` | `#1E3A8A` | Azul índigo telar / gabardina. Botón de acción principal, encabezados y navegación activa. |
| `--color-lienzo` | `#F8FAFC` | Blanco algodón pima / superficie base de trabajo descansada para la vista. |
| `--color-panel` | `#FFFFFF` | Paneles de mostrador, modales y tarjetas de ticket sin sombras exageradas. |
| `--color-borde-orillo` | `#E2E8F0` | Borde orillo nítido de 1px para separación de cuadrícula y celdas. |
| `--color-tinta` | `#0F172A` | Tinta oscura de alta legibilidad para textos, códigos SKU y cifras de precios. |
| `--color-trama-gris` | `#64748B` | Tono sutil para unidades textiles (`metro`, `cono`, `und`), fechas y metadatos. |
| `--color-dorado-cinta` | `#D97706` | Ámbar cinta métrica / hilo mostaza. Alerta de stock bajo y teclas de atajo rápido. |
| `--color-verde-conforme` | `#15803D` | Verde tintorero. Conciliación conforme (≤ 2%), stock óptimo y venta confirmada. |
| `--color-rojo-alerta` | `#B91C1C` | Rojo carmesí cochinilla. Conciliación no conforme (> 2%) y stock agotado. |
