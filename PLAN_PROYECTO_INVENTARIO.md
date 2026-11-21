# Plan de Proyecto: Sistema de Inventario (React + Java + PostgreSQL + Docker)

**Grupo 1** · Ingeniería Informática (5.º semestre) · Universidad de Caldas

---

## 1. Requisitos de la actividad

| Requisito | Cómo lo cumplimos |
|---|---|
| **Stack: React + Java + PostgreSQL** | React 18 (Vite + Tailwind CSS) + Spring Boot 3 (Java 21) + PostgreSQL 16 |
| **Despliegue en Docker** | 3 contenedores orquestados con `docker compose up --build` sin pasos manuales extra |
| **Repositorio en GitHub** | Repo `inventario-docker` con ramas (`main`, `develop`, `feature/*`) y commits convencionales |
| **2+ pantallas** | 6 pantallas funcionales + navegación lateral responsiva (ver sección 6) |
| **4+ entidades** | 6 entidades relacionadas en PostgreSQL (ver sección 4) |
| **Ejercicio clásico de inventario** | Productos, clientes, ventas con descuento automático de stock, facturación con IVA y kardex de movimientos |

---

## 2. Arquitectura y red Docker

```text
                        ┌──────────────────────────────────────────────────────┐
                        │                 Red Docker: inventario-net           │
                        │                                                      │
  Navegador             │  ┌──────────────┐   /api/*    ┌──────────────┐  JDBC │  ┌──────────────┐
  http://localhost:3000 ├──┤   Frontend   │────────────►│   Backend    │───────┼─►│  PostgreSQL  │
                        │  │ React+Nginx  │ (proxy)     │ Spring Boot  │ :5432 │  │  16-alpine   │
                        │  │   (:80)      │             │   (:8080)    │       │  │  + pgdata    │
                        │  └──────────────┘             └──────┬───────┘       │  └──────────────┘
                        │                                      │               │
  Postman / Swagger     │                                      │               │
  http://localhost:8080 ├──────────────────────────────────────┘               │
                        └──────────────────────────────────────────────────────┘
```

### Decisiones clave de arquitectura
- **Frontend (React + Nginx)**: Compilado con Vite y servido por Nginx en el puerto `3000`. Nginx actúa además como **reverse proxy** para `/api/*` hacia `http://backend:8080`, evitando problemas de CORS y URLs hardcodeadas en producción Docker.
- **Backend (Spring Boot 3 + Java 21)**: API REST con Web, Data JPA, Validation, Actuator (para `healthcheck`) y Springdoc OpenAPI (Swagger UI en `http://localhost:8080/swagger-ui.html`).
- **Base de datos (PostgreSQL 16)**: Corre en `postgres:16-alpine` con volumen persistente `pgdata` y `healthcheck` con `pg_isready`. Solo accesible dentro de `inventario-net` (y opcionalmente mapeada en desarrollo si se desea conectar DBeaver).
- **Cero pasos manuales**: `docker-compose.yml` usa valores por defecto (`${DB_NAME:-inventario}`) para que `docker compose up --build` funcione de inmediato incluso si aún no se ha creado `.env`.

---

## 3. Estructura del repositorio

```text
inventario-docker/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/co/udecaldas/inventario/
│       │   │   ├── InventarioApplication.java
│       │   │   ├── config/          # CorsConfig, DataSeeder (datos iniciales idempotentes)
│       │   │   ├── entity/          # Producto, Cliente, Venta, DetalleVenta, Factura, MovimientoInventario
│       │   │   ├── repository/      # JpaRepository por entidad
│       │   │   ├── service/         # Lógica transaccional (@Transactional)
│       │   │   ├── controller/      # Controladores REST (/api/*)
│       │   │   ├── dto/             # Java records (Request/Response)
│       │   │   └── exception/       # GlobalExceptionHandler (@RestControllerAdvice)
│       │   └── resources/
│       │       └── application.yml
│       └── test/                    # Pruebas básicas con JUnit
└── frontend/
    ├── Dockerfile
    ├── .dockerignore
    ├── nginx.conf
    ├── package.json
    ├── package-lock.json            # Obligatorio en el repo para `npm ci` en Docker
    ├── vite.config.js               # Proxy /api -> http://localhost:8080 para dev local
    └── src/
        ├── api/                     # Cliente Axios apuntando a /api
        ├── components/              # Layout, Sidebar, Modal, Toast, StockBadge, DataTable
        ├── pages/                   # Dashboard, Productos, Clientes, NuevaVenta, Facturas, Inventario
        ├── utils/                   # Formateadores de moneda (COP) y fechas
        └── App.jsx
```

---

## 4. Modelo de datos (6 entidades)

```text
Cliente (1) ──────── (N) Venta (1) ──────── (1) Factura
                           │
                          (1)
                           │
                          (N)
                     DetalleVenta
                          (N)
                           │
                          (1)
                        Producto (1) ──────── (N) MovimientoInventario
```

| Entidad | Campos principales | Tipos / Restricciones clave | Relaciones |
|---|---|---|---|
| **Producto** | `id`, `sku`, `nombre`, `categoria`, `descripcion`, `precio`, `stock_actual`, `stock_minimo`, `activo` | `sku` UNIQUE, `precio` `NUMERIC(12,2)` (`BigDecimal`), `activo` boolean (borrado lógico) | `1 → N` DetalleVenta, `1 → N` MovimientoInventario |
| **Cliente** | `id`, `nombre`, `documento`, `email`, `telefono`, `direccion`, `activo` | `documento` UNIQUE, `email` validado, `activo` boolean (borrado lógico) | `1 → N` Venta |
| **Venta** | `id`, `fecha`, `subtotal`, `iva`, `total`, `estado` | `estado` (`COMPLETADA`, `ANULADA`), montos en `BigDecimal` | `N → 1` Cliente, `1 → N` DetalleVenta, `1 → 1` Factura |
| **DetalleVenta** | `id`, `cantidad`, `precio_unitario`, `subtotal` | `cantidad > 0`, guarda `precio_unitario` histórico al momento de la venta | `N → 1` Venta, `N → 1` Producto |
| **Factura** | `id`, `numero`, `fecha_emision`, `subtotal`, `iva`, `total` | `numero` UNIQUE (ej. `FAC-00001`), IVA 19 % | `1 → 1` Venta |
| **MovimientoInventario** | `id`, `tipo`, `cantidad`, `stock_anterior`, `stock_nuevo`, `fecha`, `motivo` | `tipo` (`ENTRADA`, `SALIDA`, `AJUSTE`), trazabilidad completa de kardex | `N → 1` Producto |

### Reglas de negocio obligatorias
1. **Atomicidad (`@Transactional`)**: Registrar una venta valida stock de todos los ítems, descuenta `stock_actual`, guarda `Venta` + `DetalleVenta`, crea `MovimientoInventario` (`SALIDA`) y genera la `Factura` en una sola transacción. Si falla un ítem, se revierte todo.
2. **Validación de stock**: No se permite vender más unidades que `stock_actual` ni registrar salidas que dejen el stock negativo (retorna `400 Bad Request` con mensaje claro).
3. **Facturación automática**: Cada venta confirmada genera su `Factura` con consecutivo único (`FAC-00001`, `FAC-00002`, ...) y cálculo exacto con `BigDecimal` (IVA 19 %).
4. **Borrado lógico (`activo = false`)**: Eliminar un producto o cliente que ya tiene ventas o movimientos lo desactiva en lugar de romper claves foráneas en PostgreSQL.
5. **Entradas y ajustes**: Compras/reposiciones suman stock con movimiento `ENTRADA`; correcciones de conteo físico registran `AJUSTE`.
6. **Alerta de stock bajo**: Cualquier producto activo con `stock_actual <= stock_minimo` se resalta en el Dashboard y en la tabla de Productos.
7. **Datos semilla idempotentes**: Un `CommandLineRunner` (`DataSeeder`) carga 6–8 productos, 3–4 clientes y movimientos iniciales **solo si la BD está vacía**, evitando errores al reiniciar contenedores.

---

## 5. API REST (Endpoints y contratos)

Todos los endpoints usan **DTOs (`record` de Java 21)** y nunca exponen entidades JPA directamente (evita ciclos infinitos de serialización JSON).

| Recurso | Endpoints | Notas |
|---|---|---|
| **Salud** | `GET /actuator/health` | Usado por el `healthcheck` de Docker |
| **Docs** | `GET /swagger-ui.html` | Documentación interactiva generada con Springdoc |
| **Dashboard** | `GET /api/dashboard/resumen` | Total productos, ventas del día, ingresos del día, conteo y lista de stock bajo |
| **Productos** | `GET /api/productos?q=&soloStockBajo=`, `POST /api/productos`, `GET/PUT/DELETE /api/productos/{id}` | `DELETE` realiza borrado lógico |
| **Clientes** | `GET /api/clientes?q=`, `POST /api/clientes`, `GET/PUT/DELETE /api/clientes/{id}` | Validación de documento único |
| **Ventas** | `GET /api/ventas`, `POST /api/ventas`, `GET /api/ventas/{id}` | `POST` recibe `clienteId` y lista de `{ productoId, cantidad }` |
| **Facturas** | `GET /api/facturas`, `GET /api/facturas/{id}` | Incluye datos del cliente, ítems y desglose subtotal/IVA/total |
| **Inventario** | `GET /api/movimientos`, `POST /api/movimientos`, `GET /api/movimientos/producto/{id}` | Kardex filtrado por producto o general |

### Manejo global de errores (`@RestControllerAdvice`)
Todas las excepciones devuelven un JSON uniforme `{ timestamp, status, error, message, details }`:
- `400 Bad Request`: validaciones de campos (`@Valid`) o stock insuficiente.
- `404 Not Found`: ID inexistente.
- `409 Conflict`: SKU o documento duplicado.

---

## 6. Pantallas (6) y Lineamientos de Diseño UI/UX

Basado en las skills importadas (`ui-ux-pro-max` y `ui-animation`), el diseño sigue un estilo **Clean SaaS / Dashboard de Inventario** enfocado en legibilidad, accesibilidad y rapidez operativa:

### Sistema visual y UX
- **Paleta semántica (contraste ≥ 4.5:1)**:
  - Fondo general `#F8FAFC`, tarjetas `#FFFFFF` con borde `#E2E8F0`.
  - Texto principal `#0F172A`, secundario `#475569`.
  - Acción primaria `#2563EB` (azul índigo), estados semánticos: **Stock OK** (esmeralda), **Stock bajo** (ámbar), **Sin stock / Error** (rojo).
- **Tipografía y datos numéricos**: Fuente sans-serif limpia (`Inter`) con `tabular-nums` (`font-variant-numeric: tabular-nums`) en precios, SKUs, cantidades y totales para que las columnas numéricas se alineen perfectamente.
- **Iconografía**: Iconos SVG consistentes con `lucide-react` (**sin emojis como iconos**).
- **Formularios y feedback**: Etiquetas visibles siempre (nunca solo placeholder), errores de validación junto a cada campo, estados de carga (*skeletons*/spinners), estados vacíos claros, modal de confirmación para eliminar y notificaciones tipo *toast*.
- **Accesibilidad y responsive**: Menú lateral colapsable en móvil, objetivos táctiles ≥ 44×44 px, anillos de foco (`focus-visible`) preservados para navegación con teclado.
- **Micro-interacciones (`ui-animation`)**: Transiciones CSS sutiles (150–200 ms) para modales, toasts y badges; entradas instantáneas para navegación repetida y respeto estricto a `prefers-reduced-motion`.

### Detalle de las 6 pantallas
1. **Dashboard (`/`)**: 4 tarjetas KPI (productos activos, ventas de hoy, ingresos del día, alertas de stock bajo), tabla rápida de productos por reponer y últimas ventas.
2. **Productos (`/productos`)**: Buscador en tiempo real, filtro de stock bajo, tabla con badges de estado (`OK` / `Bajo` / `Agotado`) y modal para crear/editar/desactivar.
3. **Clientes (`/clientes`)**: Buscador y CRUD completo con validación de documento y correo.
4. **Nueva Venta (`/ventas/nueva`)**: Flujo tipo POS ligero: seleccionar cliente, buscar y añadir productos con control de cantidad (validado contra `stock_actual`), resumen en vivo de subtotal + IVA (19 %) + total, y botón confirmar que redirige/muestra la factura generada.
5. **Facturas / Historial (`/facturas`)**: Listado de ventas/facturas con fecha, cliente y total; vista de detalle tipo documento imprimible (`window.print()`).
6. **Inventario / Kardex (`/inventario`)**: Formulario para registrar `ENTRADA` o `AJUSTE` con motivo, y tabla cronológica de movimientos filtrable por producto mostrando `stock_anterior → stock_nuevo`.

---

## 7. Configuración de Docker

### `backend/Dockerfile` (multi-stage optimizado)
```dockerfile
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### `frontend/Dockerfile` (multi-stage)
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

### `frontend/nginx.conf` (SPA + Reverse Proxy al backend)
```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location /api/ {
    proxy_pass http://backend:8080/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

### `docker-compose.yml`
```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: inventario-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME:-inventario}
      POSTGRES_USER: ${DB_USER:-inventario_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-inventario_pass}
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - inventario-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-inventario_user} -d ${DB_NAME:-inventario}"]
      interval: 5s
      timeout: 5s
      retries: 10

  backend:
    build: ./backend
    container_name: inventario-backend
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/${DB_NAME:-inventario}
      SPRING_DATASOURCE_USERNAME: ${DB_USER:-inventario_user}
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD:-inventario_pass}
      SPRING_JPA_HIBERNATE_DDL_AUTO: update
    ports:
      - "8080:8080"
    networks:
      - inventario-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 25s

  frontend:
    build: ./frontend
    container_name: inventario-frontend
    restart: unless-stopped
    depends_on:
      backend:
        condition: service_healthy
    ports:
      - "3000:80"
    networks:
      - inventario-net

volumes:
  pgdata:

networks:
  inventario-net:
    driver: bridge
```

### `.env.example`
```env
DB_NAME=inventario
DB_USER=inventario_user
DB_PASSWORD=cambiar_esta_clave
```

### Comandos de operación
```bash
# 1. (Opcional) Personalizar credenciales
cp .env.example .env

# 2. Construir y levantar los 3 contenedores
docker compose up --build -d

# 3. Verificar que db y backend estén healthy y frontend arriba
docker compose ps

# 4. Ver logs en vivo
docker compose logs -f backend

# 5. Apagar conservando los datos de PostgreSQL
docker compose down

# 6. Apagar y reiniciar la base de datos desde cero
docker compose down -v
```

**URLs locales:**
- Aplicación web (React): `http://localhost:3000`
- API REST (Spring Boot): `http://localhost:8080/api`
- Swagger UI: `http://localhost:8080/swagger-ui.html`

---

## 8. Dependencias clave

- **Backend (`pom.xml`)**:
  - `spring-boot-starter-web`
  - `spring-boot-starter-data-jpa`
  - `spring-boot-starter-validation`
  - `spring-boot-starter-actuator`
  - `springdoc-openapi-starter-webmvc-ui`
  - `postgresql`
  - `lombok`
- **Frontend (`package.json`)**:
  - `react`, `react-dom`, `react-router-dom`
  - `axios`
  - `tailwindcss`
  - `lucide-react` (iconos SVG)

---

## 9. Flujo de trabajo en GitHub

- **Ramas**: `main` (versión estable de entrega), `develop` (integración), y `feature/<tarea>` (ej. `feature/backend-productos`, `feature/frontend-ventas`, `feature/docker-compose`).
- **Commits convencionales**: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`.
- **Pull Requests**: Toda feature entra a `develop` mediante PR revisado por un compañero antes de hacer merge a `main`.
- **`.gitignore` obligatorio**: `.env`, `target/`, `node_modules/`, `dist/`, `.idea/`, `.vscode/`.
- **`README.md`**: Descripción del proyecto, arquitectura, requisitos previos (solo Docker Desktop), comando único de arranque, capturas de pantalla y tabla de integrantes.

---

## 10. Plan de trabajo por fases

| Fase | Tareas | Entregable verificable |
|---|---|---|
| **1. Setup & Git** | Crear repo GitHub, estructura `backend/` + `frontend/`, `.gitignore`, `.env.example` y `docker-compose.yml` con PostgreSQL | BD corriendo en Docker (`healthy`) |
| **2. Backend base** | Spring Boot 3, 6 entidades JPA, repositorios, `GlobalExceptionHandler`, `DataSeeder`, Swagger | Tablas creadas + datos semilla + Swagger activo |
| **3. CRUDs** | DTOs, servicios y controladores de `Producto` y `Cliente` (con borrado lógico y validaciones) | CRUD probado en Swagger / Postman |
| **4. Lógica de inventario** | `VentaService` transaccional (descuento de stock + `Factura` + `MovimientoInventario`), `MovimientoService` y `DashboardService` | Venta completa descuenta stock y genera factura |
| **5. Frontend base** | Vite + React + Tailwind + Lucide + React Router + Layout responsivo + cliente Axios (`/api`) | Navegación entre las 6 rutas con proxy |
| **6. Pantallas** | Implementar Dashboard, Productos, Clientes, Nueva Venta, Facturas y Kardex con feedback (toasts, modales, validaciones) | Flujo completo de negocio desde el navegador |
| **7. Dockerización end-to-end** | Dockerfiles multi-stage, `nginx.conf`, healthchecks y prueba limpia (`docker compose down -v && docker compose up --build`) | Todo levanta con un solo comando sin errores |
| **8. Cierre y entrega** | Capturas en `README.md`, prueba de persistencia al reiniciar contenedores, revisión del checklist | Repo listo para sustentar |

---

## 11. Plan de verificación en Docker (Checklist de entrega)

- [ ] Repositorio en GitHub con ramas y commits distribuidos del equipo
- [ ] `docker compose up --build` levanta `db`, `backend` y `frontend` en una máquina limpia sin pasos manuales extra
- [ ] `docker compose ps` muestra `inventario-db` y `inventario-backend` en estado `healthy`
- [ ] Mínimo 2 pantallas funcionales (implementadas: **6**)
- [ ] Mínimo 4 entidades relacionadas (implementadas: **6**)
- [ ] CRUD completo de Productos y Clientes con validaciones y borrado lógico
- [ ] Registrar una venta descuenta stock, crea movimiento `SALIDA` y genera factura con IVA 19 %
- [ ] Intentar vender más del stock disponible devuelve error claro sin corromper datos
- [ ] **Prueba de persistencia**: crear un producto/venta, ejecutar `docker compose restart`, recargar `http://localhost:3000` y comprobar que los datos siguen ahí
- [ ] `.env.example` versionado y `.env` ignorado en `.gitignore`
- [ ] `README.md` claro con instrucciones de despliegue y capturas

---

## 12. Skills disponibles para la implementación

En `c:\Users\anton\Downloads\skills` ya se cuenta con:
- **`ui-ux-pro-max`**: Reglas de diseño UI/UX, accesibilidad, tipografía, contraste y layouts (ya aplicadas en la sección 6).
- **`ui-animation`**: Principios de micro-interacciones y transiciones CSS limpias.
- **`find-skills`**: Permite buscar e importar skills adicionales con `npx skills find <tema>` / `npx skills add <paquete>` (por ejemplo, skills de Spring Boot, Docker o PostgreSQL si se necesitan durante el desarrollo).

---

## 13. Posibles mejoras (opcional si sobra tiempo)

- Autenticación con roles **Admin** y **Vendedor** (Spring Security + JWT)
- Gráficas de ventas en el Dashboard con `recharts`
- Exportación de factura a PDF
- Pruebas automatizadas (JUnit + Vitest) y GitHub Actions para validar el build de Docker
