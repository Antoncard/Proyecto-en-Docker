package co.udecaldas.inventario.dto;

import co.udecaldas.inventario.entity.MovimientoInventario;
import co.udecaldas.inventario.entity.TipoMovimiento;

import java.time.LocalDateTime;

public record MovimientoResponse(
        Long id,
        Long productoId,
        String productoSku,
        String productoNombre,
        TipoMovimiento tipo,
        Integer cantidad,
        Integer stockAnterior,
        Integer stockNuevo,
        LocalDateTime fecha,
        String motivo
) {
    public static MovimientoResponse from(MovimientoInventario m) {
        return new MovimientoResponse(
                m.getId(),
                m.getProducto().getId(),
                m.getProducto().getSku(),
                m.getProducto().getNombre(),
                m.getTipo(),
                m.getCantidad(),
                m.getStockAnterior(),
                m.getStockNuevo(),
                m.getFecha(),
                m.getMotivo()
        );
    }
}
