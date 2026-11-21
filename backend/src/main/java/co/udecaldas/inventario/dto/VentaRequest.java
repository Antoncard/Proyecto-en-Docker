package co.udecaldas.inventario.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record VentaRequest(
        @NotNull(message = "El cliente es obligatorio")
        Long clienteId,

        @NotEmpty(message = "Debe agregar al menos un producto a la venta")
        @Valid
        List<VentaItemRequest> items
) {}
