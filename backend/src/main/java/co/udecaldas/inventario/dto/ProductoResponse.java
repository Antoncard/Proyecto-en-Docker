package co.udecaldas.inventario.dto;

import co.udecaldas.inventario.entity.Producto;

import java.math.BigDecimal;

public record ProductoResponse(
        Long id,
        String sku,
        String nombre,
        String categoria,
        String descripcion,
        BigDecimal precio,
        Integer stockActual,
        Integer stockMinimo,
        boolean stockBajo
) {
    public static ProductoResponse from(Producto p) {
        return new ProductoResponse(
                p.getId(),
                p.getSku(),
                p.getNombre(),
                p.getCategoria(),
                p.getDescripcion(),
                p.getPrecio(),
                p.getStockActual(),
                p.getStockMinimo(),
                p.getStockActual() <= p.getStockMinimo()
        );
    }
}
