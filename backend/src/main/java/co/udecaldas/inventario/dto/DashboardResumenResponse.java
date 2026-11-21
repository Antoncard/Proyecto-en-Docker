package co.udecaldas.inventario.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record DashboardResumenResponse(
        long totalProductos,
        long totalClientes,
        long ventasHoy,
        BigDecimal ingresosHoy,
        long cantidadStockBajo,
        List<ProductoResponse> productosStockBajo,
        List<VentaRecienteItem> ultimasVentas
) {
    public record VentaRecienteItem(
            Long id,
            String facturaNumero,
            String clienteNombre,
            LocalDateTime fecha,
            BigDecimal total
    ) {}
}
