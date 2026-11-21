package co.udecaldas.inventario.dto;

import co.udecaldas.inventario.entity.EstadoVenta;
import co.udecaldas.inventario.entity.Venta;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record VentaResponse(
        Long id,
        LocalDateTime fecha,
        EstadoVenta estado,
        Long clienteId,
        String clienteNombre,
        String clienteDocumento,
        BigDecimal subtotal,
        BigDecimal iva,
        BigDecimal total,
        Long facturaId,
        String facturaNumero,
        List<DetalleVentaResponse> detalles
) {
    public static VentaResponse from(Venta v) {
        return new VentaResponse(
                v.getId(),
                v.getFecha(),
                v.getEstado(),
                v.getCliente().getId(),
                v.getCliente().getNombre(),
                v.getCliente().getDocumento(),
                v.getSubtotal(),
                v.getIva(),
                v.getTotal(),
                v.getFactura() != null ? v.getFactura().getId() : null,
                v.getFactura() != null ? v.getFactura().getNumero() : null,
                v.getDetalles().stream().map(DetalleVentaResponse::from).toList()
        );
    }
}
