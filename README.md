# Sistema de Ventas e Inventario · Textilería

Prototipo de software para la gestión comercial y control de existencias de una empresa del rubro textil en Lima, Perú (confección y comercialización de telas, hilos, avíos y prendas en el emporio comercial de Gamarra / Ate).

El sistema fue concebido para el curso de **Calidad de Software** (Universidad César Vallejo - UCV 2026) y está diseñado bajo los lineamientos y métricas de la norma internacional de calidad de software **ISO/IEC 25010:2023** (adecuación funcional, usabilidad, fiabilidad y eficiencia de desempeño).

---

## 📌 Módulos del Sistema

El sistema cuenta con 5 módulos funcionales integrados:

1. **🔐 Usuarios y Control de Acceso (Auth & RBAC):**
   - Autenticación segura mediante tokens JWT y contraseñas hasheadas con BCrypt.
   - Control de acceso basado en 4 roles estrictos: **Administrador**, **Vendedor**, **Almacenero** y **Gerente**.
   - Cierre de sesión manual y bloqueo preventivo de rutas no autorizadas en el frontend y backend.

2. **📦 Inventario Textil:**
   - Catálogo de productos clasificados por categorías textiles (Telas de Algodón, Sintéticas, Hilos y Conos, Avíos y Accesorios, Prendas Terminadas).
   - Control por código SKU único y unidades de medida específicas del sector (`metro`, `cono`, `bolsa`, `unidad`).
   - Alertas automáticas de stock mínimo y estados visuales (Normal, Bajo, Agotado).
   - Registro de movimientos de almacén: ingresos por compra/proveedor y ajustes manuales justificados con kardex histórico.

3. **🛒 Punto de Venta y Facturación Interna (Caja POS):**
   - Carrito de compras con búsqueda y filtrado rápido de productos textiles.
   - Validación atómica de stock en tiempo real: previene sobreventas concurrentes y descuenta existencias en una sola transacción (`todo o nada`).
   - Cálculo financiero exacto mediante el tipo nativo `Decimal` en el servidor (subtotal, descuento comercial con tope por rol, IGV 18% y total redondeado a 2 decimales según normativa peruana).
   - Métodos de pago adaptados a la realidad comercial: Efectivo, Yape/Plin, Transferencia bancaria y Tarjeta de crédito/débito.
   - Historial detallado de comprobantes emitidos.

4. **🚦 Conciliación de Stock (Auditoría Física y Semáforo):**
   - Apertura y gestión de sesiones de auditoría física de almacén.
   - Captura en tiempo real del stock lógico del sistema vs. conteo físico real.
   - Cálculo automático del porcentaje de desvío y clasificación visual con **semáforo de tolerancia ISO/IEC 25010 (RNF-02)**:
     - 🟢 **Verde (Conforme):** Discrepancia $\le$ 2.0 %.
     - 🔴 **Rojo (No Conforme):** Discrepancia > 2.0 %.
   - Ajuste automático de diferencias con motivo justificado para regularizar el inventario.

5. **📊 Dashboard Gerencial y Reportes:**
   - Panel de control para toma de decisiones con métricas clave: total vendido, ingresos brutos, transacciones y alertas de reposición.
   - Reportes de rendimiento por periodo de fechas y por vendedor.
   - Gráficos analíticos interactivos y listado de productos más demandados.

---

## 📁 Consideraciones del Repositorio (.gitignore)

Para mantener el repositorio limpio y seguro, varios archivos y carpetas locales han sido excluidos del control de versiones mediante el archivo `.gitignore`:

- ❌ **Base de datos local (`*.db`, `*.sqlite`):** El archivo de base de datos SQLite (`textileria.db`) **no** está en el repositorio público. Se debe generar ejecutando el script de datos semilla (`db_seed`).
- ❌ **Variables de entorno (`.env`):** No se suben credenciales secretas. En su lugar, se proporciona una plantilla `backend/.env.example` lista para ser copiada.
- ❌ **Dependencias (`node_modules/`, `.venv/`):** Deben instalarse localmente con los gestores de paquetes respectivos (`uv`/`pip` y `npm`).
- ❌ **Cachés de compilación y pruebas (`dist/`, `__pycache__/`, `.pytest_cache/`, `htmlcov/`):** Se regeneran dinámicamente en tiempo de ejecución.

---

## 🚀 Guía de Instalación Paso a Paso

Sigue estos pasos detallados para clonar, configurar y poner en marcha el sistema en cualquier entorno local.

### Prerrequisitos

Asegúrate de tener instaladas las siguientes herramientas en tu sistema operativo:

- **Git** ([Descargar Git](https://git-scm.com/))
- **Python 3.12+** ([Descargar Python](https://www.python.org/))
- **Node.js 18+ o 20+** con **npm** ([Descargar Node.js](https://nodejs.org/))
- *(Recomendado)* **uv** (Gestor ultrarrápido de paquetes Python):
  ```powershell
  # Windows (PowerShell):
  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
  # Linux/macOS:
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```

---

### Paso 1: Clonar el Repositorio

Abre una terminal y clona el proyecto en tu máquina local:

```bash
git clone https://github.com/tu-usuario/sistema-textileria.git
cd sistema-textileria
```

---

### Paso 2: Configuración del Backend (FastAPI)

1. **Ingresa al directorio del backend:**
   ```bash
   cd backend
   ```

2. **Crear el archivo de variables de entorno `.env`:**
   Copia el archivo de ejemplo preconfigurado `.env.example`:
   - **En Windows (PowerShell / CMD):**
     ```powershell
     copy .env.example .env
     ```
   - **En Linux / macOS:**
     ```bash
     cp .env.example .env
     ```

   *(Opcional: puedes revisar el `.env` generado para confirmar los valores por defecto como `DATABASE_URL=sqlite:///./textileria.db` y el puerto de conexión).*

3. **Instalar las dependencias de Python:**
   - **Opción recomendada (con `uv`):**
     ```powershell
     uv sync
     ```
   - **Opción estándar (con `pip` y `venv` tradicional):**
     ```powershell
     python -m venv .venv
     # Activar el entorno virtual:
     # En Windows: .venv\Scripts\activate
     # En Linux/macOS: source .venv/bin/activate
     pip install -e .
     ```

4. **Inicializar la base de datos y cargar los datos semilla:**
   Debido a que la base de datos está ignorada en `.gitignore`, este comando creará automáticamente el archivo `textileria.db`, generará todas las tablas e insertará los usuarios base, categorías textiles, productos con stock, ventas históricas y auditorías de prueba:

   - Con `uv`:
     ```powershell
     uv run python -m app.db_seed
     ```
   - Con entorno virtual activo:
     ```powershell
     python -m app.db_seed
     ```

5. **Regresar a la raíz del proyecto:**
   ```bash
   cd ..
   ```

---

### Paso 3: Configuración del Frontend (React + Vite)

1. **Ingresa al directorio del frontend:**
   ```bash
   cd frontend
   ```

2. **Instalar las dependencias de Node.js:**
   ```bash
   npm install
   ```

3. **Regresar a la raíz del proyecto:**
   ```bash
   cd ..
   ```

---

### Paso 4: Ejecución del Sistema

Tienes dos alternativas para levantar el sistema:

#### Alternativa A: Ejecución integrada en 1 solo comando (Recomendada)

Desde la **raíz del proyecto**, ejecuta el orquestador que inicia tanto el backend como el frontend de forma simultánea, mostrando la salida de ambos con colores identificadores en una sola terminal:

- **Con Python:**
  ```powershell
  python dev.py
  ```
- **O en Windows mediante el script por lotes:**
  ```cmd
  dev.bat
  ```
- **O mediante npm:**
  ```bash
  npm run dev
  ```

> Para detener ambos servidores de forma limpia, presiona `Ctrl + C` en la terminal.

---

#### Alternativa B: Ejecución en terminales separadas

Si prefieres tener terminales individuales para monitorear logs independientes:

- **Terminal 1 (Backend):**
  ```powershell
  cd backend
  uv run uvicorn app.main:app --reload --port 8000
  ```

- **Terminal 2 (Frontend):**
  ```powershell
  cd frontend
  npm run dev
  ```

---

### Paso 5: Abrir la Aplicación en el Navegador

Una vez que los servidores estén en ejecución, abre tu navegador web en las siguientes direcciones:

| Servicio | URL | Descripción |
| --- | --- | --- |
| **Frontend Web** | [http://localhost:5173](http://localhost:5173) | Interfaz visual del sistema (Login, Ventas, Inventario, Reportes) |
| **Backend API** | [http://127.0.0.1:8000](http://127.0.0.1:8000) | Servicio REST en FastAPI |
| **Documentación Swagger** | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) | Explorador interactivo OpenAPI de todos los endpoints |
| **Documentación ReDoc** | [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc) | Especificación técnica detallada de la API |

---

## 🔑 Credenciales de Acceso para Pruebas

El script de inicialización (`db_seed`) registra automáticamente 4 usuarios con distintos perfiles para evaluar los permisos y la navegación por roles:

| Rol | Usuario | Contraseña | Permisos y Alcance |
| --- | --- | --- | --- |
| **Administrador** | `admin` | `Admin123!` | Acceso irrestricto: gestión de usuarios, inventario, ajustes, anulación de ventas y reportes. |
| **Vendedor** | `vendedor1` | `Vendedor123!` | Registro de ventas en caja POS, consulta de catálogo y verificación de stock disponible. |
| **Almacenero** | `almacen1` | `Almacen123!` | Gestión de productos textiles, registro de ingresos por compras y ejecución de conteos físicos. |
| **Gerente** | `gerente1` | `Gerente123!` | Acceso ejecutivo en modo solo lectura al dashboard, gráficos de ventas y reportes periódicos. |

---

## 🧪 Pruebas y Control de Calidad del Código

El proyecto incluye herramientas para validar la calidad, estilo y funcionamiento del código:

```powershell
# Desde backend/:
uv run ruff check .                                 # Linter de Python (Ruff)
uv run ruff format --check .                        # Validación de formato PEP 8
uv run pytest                                       # Ejecución de la suite de pruebas
uv run pytest --cov=app --cov-report=term-missing   # Reporte de cobertura de código

# Desde frontend/:
npm run lint                                        # Linter de TypeScript/React (Oxlint)
npm run build                                       # Verificación de tipos y compilación de producción
```

---

## 🛠️ Tecnologías Utilizadas

### Backend & Servicios
- **Lenguaje:** [Python 3.12+](https://www.python.org/)
- **Framework Web:** [FastAPI 0.115+](https://fastapi.tiangolo.com/) (API REST asíncrona de alto desempeño)
- **Cálculo Financiero:** Módulo estándar `Decimal` con redondeo `ROUND_HALF_UP` (precisión exacta sin floats)
- **ORM & Base de Datos:** [SQLAlchemy 2.0](https://www.sqlalchemy.org/) y [SQLite](https://www.sqlite.org/) (desarrollo local ágil, compatible con PostgreSQL 16)
- **Validación de Datos:** [Pydantic v2](https://docs.pydantic.dev/) y `pydantic-settings`
- **Seguridad y Criptografía:** `PyJWT` (tokens de sesión) y `bcrypt` (cifrado irreversible de credenciales)
- **Servidor ASGI:** [Uvicorn](https://www.uvicorn.org/)

### Frontend & Experiencia de Usuario
- **Biblioteca Base:** [React 19](https://react.dev/)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) (tipado estático riguroso)
- **Empaquetador & Dev Server:** [Vite 8](https://vite.dev/)
- **Enrutamiento SPA:** [React Router v7](https://reactrouter.com/)
- **Gestión de Estado de Servidor:** [TanStack Query v5](https://tanstack.com/query/latest) (caché reactiva y mutaciones optimistas)
- **Estilos & Diseño:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Componentes & Iconografía:** [Lucide React](https://lucide.dev/)
- **Formularios & Validación:** [React Hook Form](https://react-hook-form.com/) con esquemas [Zod](https://zod.dev/)
- **Visualización Gráfica:** [Recharts](https://recharts.org/) (gráficos de barras y líneas para el módulo gerencial)

### Herramientas de Desarrollo y Calidad
- **Gestión de Entorno Python:** [uv](https://docs.astral.sh/uv/) (Astral)
- **Linters & Formateadores:** [Ruff](https://docs.astral.sh/ruff/) (Python) y [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) (Frontend)
- **Testing:** [pytest](https://docs.pytest.org/) y [pytest-cov](https://pytest-cov.readthedocs.io/)
- **Metodología de Calidad:** ISO/IEC 25010:2023 (Adecuación funcional, Usabilidad, Fiabilidad, Rendimiento)

---

## 📚 Documentación Adicional

En la carpeta [`docs/`](docs/) se encuentra la especificación completa del sistema:

- 📄 [01-requerimientos.md](docs/01-requerimientos.md): Requerimientos funcionales (RF), no funcionales (RNF), reglas de negocio (RN) y modelo de datos relacional.
- 📄 [02-flujos-y-pantallas.md](docs/02-flujos-y-pantallas.md): Matriz de roles y permisos, flujos operativos (F-01 a F-05) y especificación de pantallas (P-01 a P-11).
- 📄 [03-plan-fases.md](docs/03-plan-fases.md): Plan de desarrollo secuencial por fases y registro histórico de avance.
- 📄 [04-brief-diseno.md](docs/04-brief-diseno.md): Identidad visual corporativa, paleta de colores y lineamientos de UI/UX.
