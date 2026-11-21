package co.udecaldas.inventario.controller;

import co.udecaldas.inventario.dto.MovimientoRequest;
import co.udecaldas.inventario.dto.MovimientoResponse;
import co.udecaldas.inventario.service.MovimientoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/movimientos")
@RequiredArgsConstructor
public class MovimientoController {

    private final MovimientoService movimientoService;

    @GetMapping
    public List<MovimientoResponse> listar() {
        return movimientoService.listarTodos();
    }

    @GetMapping("/producto/{productoId}")
    public List<MovimientoResponse> listarPorProducto(@PathVariable Long productoId) {
        return movimientoService.listarPorProducto(productoId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MovimientoResponse registrar(@Valid @RequestBody MovimientoRequest request) {
        return movimientoService.registrar(request);
    }
}
