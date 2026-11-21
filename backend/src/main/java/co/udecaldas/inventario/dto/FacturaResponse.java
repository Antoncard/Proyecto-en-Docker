package co.udecaldas.inventario.dto;

import co.udecaldas.inventario.entity.Factura;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record FacturaResponse(
        Long id,
        String numero,
        LocalDateTime fechaEmision,
        Long ventaId,
        String clienteNombre,
        String clienteDocumento,
        String clienteEmail,
        String clienteDireccion,
        BigDecimal subtotal,
        BigDecimal iva,
        BigDecimal total,
        List<DetalleVentaResponse> detalles
) {
    public static FacturaResponse from(Factura f) {
        var venta = f.getVenta();
        var cliente = venta.getCliente();
        return new FacturaResponse(
                f.getId(),
                f.getNumero(),
                f.getFechaEmision(),
                venta.getId(),
                cliente.getNombre(),
                cliente.getDocumento(),
                cliente.getEmail(),
                cliente.getDireccion(),
                f.getSubtotal(),
                f.getIva(),
                f.getTotal(),
                venta.getDetalles().stream().map(DetalleVentaResponse::from).toList()
        );
    }
}
