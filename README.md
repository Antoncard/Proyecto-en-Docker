# Sistema de Inventario — React + Java + PostgreSQL + Docker

**Grupo 1** · Ingeniería Informática (5.º semestre) · Universidad de Caldas

Aplicación web full-stack para gestión clásica de inventario, ventas, facturación con IVA (19 %) y kardex de movimientos, completamente contenedorizada con Docker Compose.

## Stack Tecnológico

- **Frontend:** React 18, Vite, Tailwind CSS, React Router, Axios, Lucide Icons, Nginx (reverse proxy)
- **Backend:** Java 21, Spring Boot 3, Spring Data JPA, Bean Validation, Spring Actuator, Swagger / OpenAPI
- **Base de Datos:** PostgreSQL 16 (volumen persistente `pgdata`)
- **Infraestructura:** Docker & Docker Compose (3 servicios en red interna `inventario-net`)

## Entidades (6)

1. `Producto` (borrado lógico, SKU único, precio `BigDecimal`, stock actual y mínimo)
2. `Cliente` (borrado lógico, documento único)
3. `Venta` (transaccional, estado `COMPLETADA`/`ANULADA`)
4. `DetalleVenta` (histórico de precio unitario y subtotal)
5. `Factura` (generación automática con consecutivo `FAC-00001` e IVA 19 %)
6. `MovimientoInventario` (kardex `ENTRADA`, `SALIDA`, `AJUSTE` con `stock_anterior` y `stock_nuevo`)

## Pantallas (6)

1. **Dashboard:** KPIs del día, alertas de stock bajo y últimas ventas.
2. **Productos:** Búsqueda, filtro de stock bajo y CRUD completo.
3. **Clientes:** Búsqueda y CRUD completo.
4. **Nueva Venta:** Selección de cliente, carrito con validación de stock y cálculo en vivo de subtotal + IVA.
5. **Facturas:** Historial de ventas y detalle imprimible de factura.
6. **Inventario (Kardex):** Registro de entradas/ajustes y trazabilidad histórica por producto.

## Cómo ejecutarlo con Docker

Requisito único: tener **Docker Desktop** instalado y en ejecución.

```bash
# 1. (Opcional) Personalizar credenciales
cp .env.example .env

# 2. Construir y levantar los 3 contenedores
docker compose up --build -d

# 3. Verificar estado de los servicios
docker compose ps
```

### URLs disponibles

- **Aplicación Web (React):** http://localhost:3000
- **API REST (Spring Boot):** http://localhost:8080/api
- **Swagger UI (Documentación API):** http://localhost:8080/swagger-ui.html

### Otros comandos útiles

```bash
# Ver logs del backend
docker compose logs -f backend

# Apagar contenedores conservando los datos de PostgreSQL
docker compose down

# Apagar y borrar también los datos de la base de datos
docker compose down -v
```
