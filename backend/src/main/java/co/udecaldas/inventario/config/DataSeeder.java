package co.udecaldas.inventario.config;

import co.udecaldas.inventario.dto.*;
import co.udecaldas.inventario.repository.ProductoRepository;
import co.udecaldas.inventario.service.ClienteService;
import co.udecaldas.inventario.service.ProductoService;
import co.udecaldas.inventario.service.VentaService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ProductoRepository productoRepository;
    private final ProductoService productoService;
    private final ClienteService clienteService;
    private final VentaService ventaService;

    @Override
    public void run(String... args) {
        if (productoRepository.count() > 0) {
            return;
        }

        var p1 = productoService.crear(new ProductoRequest(
                "TEC-001", "Teclado Mecánico RGB TKL", "Periféricos",
                "Switches táctiles, chasis de aluminio y cable USB-C desmontable",
                new BigDecimal("245000.00"), 18, 5));

        var p2 = productoService.crear(new ProductoRequest(
                "MOU-002", "Mouse Inalámbrico Ergonómico", "Periféricos",
                "Sensor óptico 4000 DPI, batería recargable USB-C",
                new BigDecimal("115000.00"), 25, 8));

        var p3 = productoService.crear(new ProductoRequest(
                "MON-003", "Monitor 27\" IPS QHD 75Hz", "Monitores",
                "Panel IPS antirreflejo, HDMI + DisplayPort, ajuste de altura",
                new BigDecimal("1180000.00"), 6, 4));

        var p4 = productoService.crear(new ProductoRequest(
                "SSD-004", "SSD NVMe M.2 1TB Gen4", "Almacenamiento",
                "Lectura hasta 5000 MB/s, ideal para estaciones de trabajo",
                new BigDecimal("320000.00"), 4, 5));

        var p5 = productoService.crear(new ProductoRequest(
                "AUD-005", "Diadema USB con Cancelación de Ruido", "Audio",
                "Micrófono abatible para reuniones y clases virtuales",
                new BigDecimal("165000.00"), 12, 5));

        var p6 = productoService.crear(new ProductoRequest(
                "HUB-006", "Hub USB-C 7 en 1 HDMI 4K", "Accesorios",
                "HDMI, 3x USB 3.0, lector SD/microSD y Power Delivery 100W",
                new BigDecimal("139000.00"), 3, 6));

        var p7 = productoService.crear(new ProductoRequest(
                "SOP-007", "Soporte Aluminio Plegable Portátil", "Accesorios",
                "6 niveles de inclinación, antideslizante para equipos hasta 17\"",
                new BigDecimal("78000.00"), 20, 6));

        var c1 = clienteService.crear(new ClienteRequest(
                "Laura Gómez Restrepo", "1053812450", "laura.gomez@ucaldas.edu.co",
                "3104567890", "Calle 65 #26-10, Manizales"));

        var c2 = clienteService.crear(new ClienteRequest(
                "Carlos Andrés Mejía", "1053789123", "carlos.mejia@correo.com",
                "3129876543", "Carrera 23 #45-18, Manizales"));

        clienteService.crear(new ClienteRequest(
                "Soluciones Digitales Caldas SAS", "901456789-1", "compras@sdcaldas.co",
                "6068851234", "Av. Santander #52-20, Manizales"));

        // Registrar 2 ventas de ejemplo para poblar Dashboard, Facturas y Kardex
        ventaService.registrarVenta(new VentaRequest(
                c1.id(),
                List.of(
                        new VentaItemRequest(p1.id(), 2),
                        new VentaItemRequest(p2.id(), 1)
                )
        ));

        ventaService.registrarVenta(new VentaRequest(
                c2.id(),
                List.of(
                        new VentaItemRequest(p3.id(), 1),
                        new VentaItemRequest(p5.id(), 2)
                )
        ));
    }
}
