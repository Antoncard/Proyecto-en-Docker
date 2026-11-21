package co.udecaldas.inventario.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClienteRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 120, message = "El nombre no puede superar 120 caracteres")
        String nombre,

        @NotBlank(message = "El documento es obligatorio")
        @Size(max = 30, message = "El documento no puede superar 30 caracteres")
        String documento,

        @NotBlank(message = "El correo electrónico es obligatorio")
        @Email(message = "El correo electrónico no es válido")
        @Size(max = 120, message = "El correo no puede superar 120 caracteres")
        String email,

        @Size(max = 30, message = "El teléfono no puede superar 30 caracteres")
        String telefono,

        @Size(max = 200, message = "La dirección no puede superar 200 caracteres")
        String direccion
) {}
