package co.udecaldas.inventario.service;

import co.udecaldas.inventario.dto.DashboardResumenResponse;
import co.udecaldas.inventario.dto.ProductoResponse;
import co.udecaldas.inventario.repository.ClienteRepository;
import co.udecaldas.inventario.repository.ProductoRepository;
import co.udecaldas.inventario.repository.VentaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProductoRepository productoRepository;
    private final ClienteRepository clienteRepository;
    private final VentaRepository ventaRepository;

    @Transactional(readOnly = true)
    public DashboardResumenResponse obtenerResumen() {
        LocalDate hoy = LocalDate.now();
        LocalDateTime inicioDia = hoy.atStartOfDay();
        LocalDateTime finDia = hoy.atTime(LocalTime.MAX);

        long totalProductos = productoRepository.countByActivoTrue();
        long totalClientes = clienteRepository.countByActivoTrue();
        long ventasHoy = ventaRepository.countByFechaBetween(inicioDia, finDia);
        BigDecimal ingresosHoy = ventaRepository.sumTotalByFechaBetween(inicioDia, finDia);

        var stockBajo = productoRepository.findStockBajo().stream()
                .map(ProductoResponse::from)
                .toList();

        var ultimasVentas = ventaRepository.findTop5ByOrderByFechaDesc().stream()
                .map(v -> new DashboardResumenResponse.VentaRecienteItem(
                        v.getId(),
                        v.getFactura() != null ? v.getFactura().getNumero() : "-",
                        v.getCliente().getNombre(),
                        v.getFecha(),
                        v.getTotal()
                ))
                .toList();

        return new DashboardResumenResponse(
                totalProductos,
                totalClientes,
                ventasHoy,
                ingresosHoy,
                stockBajo.size(),
                stockBajo,
                ultimasVentas
        );
    }
}
