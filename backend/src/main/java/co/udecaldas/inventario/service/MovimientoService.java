package co.udecaldas.inventario.service;

import co.udecaldas.inventario.dto.MovimientoRequest;
import co.udecaldas.inventario.dto.MovimientoResponse;
import co.udecaldas.inventario.entity.MovimientoInventario;
import co.udecaldas.inventario.entity.Producto;
import co.udecaldas.inventario.entity.TipoMovimiento;
import co.udecaldas.inventario.exception.BusinessRuleException;
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
public class MovimientoService {

    private final MovimientoInventarioRepository movimientoRepository;
    private final ProductoRepository productoRepository;

    @Transactional(readOnly = true)
    public List<MovimientoResponse> listarTodos() {
        return movimientoRepository.findAllByOrderByFechaDesc().stream()
                .map(MovimientoResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MovimientoResponse> listarPorProducto(Long productoId) {
        return movimientoRepository.findByProductoIdOrderByFechaDesc(productoId).stream()
                .map(MovimientoResponse::from)
                .toList();
    }

    @Transactional
    public MovimientoResponse registrar(MovimientoRequest request) {
        Producto producto = productoRepository.findByIdAndActivoTrue(request.productoId())
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + request.productoId()));

        int stockAnterior = producto.getStockActual();
        int stockNuevo;
        int cantidadRegistrada = request.cantidad();

        if (request.tipo() == TipoMovimiento.ENTRADA) {
            if (cantidadRegistrada <= 0) {
                throw new BusinessRuleException("La cantidad de entrada debe ser mayor a 0");
            }
            stockNuevo = stockAnterior + cantidadRegistrada;
        } else if (request.tipo() == TipoMovimiento.SALIDA) {
            if (cantidadRegistrada <= 0) {
                throw new BusinessRuleException("La cantidad de salida debe ser mayor a 0");
            }
            if (cantidadRegistrada > stockAnterior) {
                throw new BusinessRuleException(
                        "Stock insuficiente para " + producto.getNombre() + ". Disponible: " + stockAnterior
                );
            }
            stockNuevo = stockAnterior - cantidadRegistrada;
        } else {
            // AJUSTE: establece el stock exacto tras conteo físico
            stockNuevo = cantidadRegistrada;
            cantidadRegistrada = Math.abs(stockNuevo - stockAnterior);
        }

        producto.setStockActual(stockNuevo);
        productoRepository.save(producto);

        MovimientoInventario movimiento = MovimientoInventario.builder()
                .producto(producto)
                .tipo(request.tipo())
                .cantidad(cantidadRegistrada)
                .stockAnterior(stockAnterior)
                .stockNuevo(stockNuevo)
                .fecha(LocalDateTime.now())
                .motivo(request.motivo().trim())
                .build();

        return MovimientoResponse.from(movimientoRepository.save(movimiento));
    }
}
