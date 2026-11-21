package co.udecaldas.inventario.service;

import co.udecaldas.inventario.dto.VentaItemRequest;
import co.udecaldas.inventario.dto.VentaRequest;
import co.udecaldas.inventario.dto.VentaResponse;
import co.udecaldas.inventario.entity.*;
import co.udecaldas.inventario.exception.BusinessRuleException;
import co.udecaldas.inventario.exception.ResourceNotFoundException;
import co.udecaldas.inventario.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class VentaService {

    private static final BigDecimal TASA_IVA = new BigDecimal("0.19");

    private final VentaRepository ventaRepository;
    private final ClienteRepository clienteRepository;
    private final ProductoRepository productoRepository;
    private final FacturaRepository facturaRepository;
    private final MovimientoInventarioRepository movimientoRepository;

    @Transactional(readOnly = true)
    public List<VentaResponse> listarTodas() {
        return ventaRepository.findAllByOrderByFechaDesc().stream()
                .map(VentaResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public VentaResponse obtenerPorId(Long id) {
        Venta venta = ventaRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Venta no encontrada con ID: " + id));
        return VentaResponse.from(venta);
    }

    @Transactional
    public VentaResponse registrarVenta(VentaRequest request) {
        Cliente cliente = clienteRepository.findByIdAndActivoTrue(request.clienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + request.clienteId()));

        // Consolidar cantidades si el mismo producto aparece repetido en la solicitud
        Map<Long, Integer> cantidadesPorProducto = new LinkedHashMap<>();
        for (VentaItemRequest item : request.items()) {
            cantidadesPorProducto.merge(item.productoId(), item.cantidad(), Integer::sum);
        }

        LocalDateTime ahora = LocalDateTime.now();
        Venta venta = Venta.builder()
                .cliente(cliente)
                .fecha(ahora)
                .estado(EstadoVenta.COMPLETADA)
                .subtotal(BigDecimal.ZERO)
                .iva(BigDecimal.ZERO)
                .total(BigDecimal.ZERO)
                .build();

        BigDecimal subtotalGeneral = BigDecimal.ZERO;

        for (Map.Entry<Long, Integer> entry : cantidadesPorProducto.entrySet()) {
            Long productoId = entry.getKey();
            int cantidad = entry.getValue();

            Producto producto = productoRepository.findByIdAndActivoTrue(productoId)
                    .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + productoId));

            if (cantidad > producto.getStockActual()) {
                throw new BusinessRuleException(
                        "Stock insuficiente para \"" + producto.getNombre() + "\". " +
                                "Solicitado: " + cantidad + ", disponible: " + producto.getStockActual()
                );
            }

            BigDecimal subtotalItem = producto.getPrecio()
                    .multiply(BigDecimal.valueOf(cantidad))
                    .setScale(2, RoundingMode.HALF_UP);

            DetalleVenta detalle = DetalleVenta.builder()
                    .venta(venta)
                    .producto(producto)
                    .cantidad(cantidad)
                    .precioUnitario(producto.getPrecio())
                    .subtotal(subtotalItem)
                    .build();

            venta.getDetalles().add(detalle);
            subtotalGeneral = subtotalGeneral.add(subtotalItem);
        }

        BigDecimal iva = subtotalGeneral.multiply(TASA_IVA).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = subtotalGeneral.add(iva).setScale(2, RoundingMode.HALF_UP);

        venta.setSubtotal(subtotalGeneral);
        venta.setIva(iva);
        venta.setTotal(total);

        Venta ventaGuardada = ventaRepository.save(venta);

        String numeroFactura = String.format("FAC-%05d", ventaGuardada.getId());
        Factura factura = Factura.builder()
                .numero(numeroFactura)
                .fechaEmision(ahora)
                .subtotal(subtotalGeneral)
                .iva(iva)
                .total(total)
                .venta(ventaGuardada)
                .build();

        facturaRepository.save(factura);
        ventaGuardada.setFactura(factura);

        // Descontar stock y registrar movimientos SALIDA
        for (DetalleVenta detalle : ventaGuardada.getDetalles()) {
            Producto producto = detalle.getProducto();
            int stockAnterior = producto.getStockActual();
            int stockNuevo = stockAnterior - detalle.getCantidad();
            producto.setStockActual(stockNuevo);
            productoRepository.save(producto);

            movimientoRepository.save(MovimientoInventario.builder()
                    .producto(producto)
                    .tipo(TipoMovimiento.SALIDA)
                    .cantidad(detalle.getCantidad())
                    .stockAnterior(stockAnterior)
                    .stockNuevo(stockNuevo)
                    .fecha(ahora)
                    .motivo("Venta registrada (" + numeroFactura + ")")
                    .build());
        }

        return VentaResponse.from(ventaGuardada);
    }
}
