package co.udecaldas.inventario.dto;

import co.udecaldas.inventario.entity.DetalleVenta;

import java.math.BigDecimal;

public record DetalleVentaResponse(
        Long id,
        Long productoId,
        String productoSku,
        String productoNombre,
        Integer cantidad,
        BigDecimal precioUnitario,
        BigDecimal subtotal
) {
    public static DetalleVentaResponse from(DetalleVenta d) {
        return new DetalleVentaResponse(
                d.getId(),
                d.getProducto().getId(),
                d.getProducto().getSku(),
                d.getProducto().getNombre(),
                d.getCantidad(),
                d.getPrecioUnitario(),
                d.getSubtotal()
        );
    }
}
