package co.udecaldas.inventario.controller;

import co.udecaldas.inventario.dto.FacturaResponse;
import co.udecaldas.inventario.service.FacturaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/facturas")
@RequiredArgsConstructor
public class FacturaController {

    private final FacturaService facturaService;

    @GetMapping
    public List<FacturaResponse> listar() {
        return facturaService.listarTodas();
    }

    @GetMapping("/{id}")
    public FacturaResponse obtener(@PathVariable Long id) {
        return facturaService.obtenerPorId(id);
    }
}
