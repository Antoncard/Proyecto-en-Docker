package co.udecaldas.inventario.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record ProductoRequest(
        @NotBlank(message = "El SKU es obligatorio")
        @Size(max = 50, message = "El SKU no puede superar 50 caracteres")
        String sku,

        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 120, message = "El nombre no puede superar 120 caracteres")
        String nombre,

        @NotBlank(message = "La categoría es obligatoria")
        @Size(max = 60, message = "La categoría no puede superar 60 caracteres")
        String categoria,

        @Size(max = 500, message = "La descripción no puede superar 500 caracteres")
        String descripcion,

        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.01", message = "El precio debe ser mayor a 0")
        BigDecimal precio,

        @NotNull(message = "El stock actual es obligatorio")
        @Min(value = 0, message = "El stock actual no puede ser negativo")
        Integer stockActual,

        @NotNull(message = "El stock mínimo es obligatorio")
        @Min(value = 0, message = "El stock mínimo no puede ser negativo")
        Integer stockMinimo
) {}
