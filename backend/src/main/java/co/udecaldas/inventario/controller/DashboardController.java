package co.udecaldas.inventario.controller;

import co.udecaldas.inventario.dto.DashboardResumenResponse;
import co.udecaldas.inventario.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/resumen")
    public DashboardResumenResponse obtenerResumen() {
        return dashboardService.obtenerResumen();
    }
}
