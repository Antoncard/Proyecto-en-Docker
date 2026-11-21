package co.udecaldas.inventario.service;

import co.udecaldas.inventario.dto.ProductoRequest;
import co.udecaldas.inventario.dto.ProductoResponse;
import co.udecaldas.inventario.entity.MovimientoInventario;
import co.udecaldas.inventario.entity.Producto;
import co.udecaldas.inventario.entity.TipoMovimiento;
import co.udecaldas.inventario.exception.DuplicateResourceException;
import co.udecaldas.inventario.exception.ResourceNotFoundException;
import co.udecaldas.inventario.repository.MovimientoInventarioRepository;
import co.udecaldas.inventario.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final MovimientoInventarioRepository movimientoRepository;

    @Transactional(readOnly = true)
    public List<ProductoResponse> listar(String q, Boolean soloStockBajo) {
        List<Producto> productos;
        if (Boolean.TRUE.equals(soloStockBajo)) {
            productos = productoRepository.findStockBajo();
        } else if (q != null && !q.isBlank()) {
            productos = productoRepository.buscarActivos(q.trim());
        } else {
            productos = productoRepository.findByActivoTrueOrderByNombreAsc();
        }
        return productos.stream().map(ProductoResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ProductoResponse obtenerPorId(Long id) {
        Producto producto = productoRepository.findByIdAndActivoTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + id));
        return ProductoResponse.from(producto);
    }

    @Transactional(readOnly = true)
    public List<ProductoResponse> listarStockBajo() {
        return productoRepository.findStockBajo().stream().map(ProductoResponse::from).toList();
    }

    @Transactional
    public ProductoResponse crear(ProductoRequest request) {
        String sku = request.sku().trim().toUpperCase();
        if (productoRepository.existsBySkuIgnoreCase(sku)) {
            throw new DuplicateResourceException("Ya existe un producto registrado con el SKU: " + sku);
        }

        Producto producto = Producto.builder()
                .sku(sku)
                .nombre(request.nombre().trim())
                .categoria(request.categoria().trim())
                .descripcion(request.descripcion() != null ? request.descripcion().trim() : "")
                .precio(request.precio())
                .stockActual(request.stockActual())
                .stockMinimo(request.stockMinimo())
                .activo(true)
                .build();

        Producto guardado = productoRepository.save(producto);

        if (guardado.getStockActual() > 0) {
            movimientoRepository.save(MovimientoInventario.builder()
                    .producto(guardado)
                    .tipo(TipoMovimiento.ENTRADA)
                    .cantidad(guardado.getStockActual())
                    .stockAnterior(0)
                    .stockNuevo(guardado.getStockActual())
                    .fecha(LocalDateTime.now())
                    .motivo("Inventario inicial al crear producto")
                    .build());
        }

        return ProductoResponse.from(guardado);
    }

    @Transactional
    public ProductoResponse actualizar(Long id, ProductoRequest request) {
        Producto producto = productoRepository.findByIdAndActivoTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + id));

        String sku = request.sku().trim().toUpperCase();
        if (productoRepository.existsBySkuIgnoreCaseAndIdNot(sku, id)) {
            throw new DuplicateResourceException("Ya existe otro producto con el SKU: " + sku);
        }

        int stockAnterior = producto.getStockActual();
        producto.setSku(sku);
        producto.setNombre(request.nombre().trim());
        producto.setCategoria(request.categoria().trim());
        producto.setDescripcion(request.descripcion() != null ? request.descripcion().trim() : "");
        producto.setPrecio(request.precio());
        producto.setStockActual(request.stockActual());
        producto.setStockMinimo(request.stockMinimo());

        Producto actualizado = productoRepository.save(producto);

        if (stockAnterior != actualizado.getStockActual()) {
            movimientoRepository.save(MovimientoInventario.builder()
                    .producto(actualizado)
                    .tipo(TipoMovimiento.AJUSTE)
                    .cantidad(Math.abs(actualizado.getStockActual() - stockAnterior))
                    .stockAnterior(stockAnterior)
                    .stockNuevo(actualizado.getStockActual())
                    .fecha(LocalDateTime.now())
                    .motivo("Ajuste manual desde edición de producto")
                    .build());
        }

        return ProductoResponse.from(actualizado);
    }

    @Transactional
    public void eliminar(Long id) {
        Producto producto = productoRepository.findByIdAndActivoTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + id));
        producto.setActivo(false);
        productoRepository.save(producto);
    }
}
