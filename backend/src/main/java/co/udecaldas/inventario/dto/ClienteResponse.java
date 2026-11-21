package co.udecaldas.inventario.dto;

import co.udecaldas.inventario.entity.Cliente;

public record ClienteResponse(
        Long id,
        String nombre,
        String documento,
        String email,
        String telefono,
        String direccion
) {
    public static ClienteResponse from(Cliente c) {
        return new ClienteResponse(
                c.getId(),
                c.getNombre(),
                c.getDocumento(),
                c.getEmail(),
                c.getTelefono(),
                c.getDireccion()
        );
    }
}
