package co.udecaldas.inventario.service;

import co.udecaldas.inventario.dto.ClienteRequest;
import co.udecaldas.inventario.dto.ClienteResponse;
import co.udecaldas.inventario.entity.Cliente;
import co.udecaldas.inventario.exception.DuplicateResourceException;
import co.udecaldas.inventario.exception.ResourceNotFoundException;
import co.udecaldas.inventario.repository.ClienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepository;

    @Transactional(readOnly = true)
    public List<ClienteResponse> listar(String q) {
        List<Cliente> clientes = (q != null && !q.isBlank())
                ? clienteRepository.buscarActivos(q.trim())
                : clienteRepository.findByActivoTrueOrderByNombreAsc();
        return clientes.stream().map(ClienteResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ClienteResponse obtenerPorId(Long id) {
        Cliente cliente = clienteRepository.findByIdAndActivoTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + id));
        return ClienteResponse.from(cliente);
    }

    @Transactional
    public ClienteResponse crear(ClienteRequest request) {
        String documento = request.documento().trim();
        if (clienteRepository.existsByDocumentoIgnoreCase(documento)) {
            throw new DuplicateResourceException("Ya existe un cliente registrado con el documento: " + documento);
        }

        Cliente cliente = Cliente.builder()
                .nombre(request.nombre().trim())
                .documento(documento)
                .email(request.email().trim())
                .telefono(request.telefono() != null ? request.telefono().trim() : "")
                .direccion(request.direccion() != null ? request.direccion().trim() : "")
                .activo(true)
                .build();

        return ClienteResponse.from(clienteRepository.save(cliente));
    }

    @Transactional
    public ClienteResponse actualizar(Long id, ClienteRequest request) {
        Cliente cliente = clienteRepository.findByIdAndActivoTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + id));

        String documento = request.documento().trim();
        if (clienteRepository.existsByDocumentoIgnoreCaseAndIdNot(documento, id)) {
            throw new DuplicateResourceException("Ya existe otro cliente con el documento: " + documento);
        }

        cliente.setNombre(request.nombre().trim());
        cliente.setDocumento(documento);
        cliente.setEmail(request.email().trim());
        cliente.setTelefono(request.telefono() != null ? request.telefono().trim() : "");
        cliente.setDireccion(request.direccion() != null ? request.direccion().trim() : "");

        return ClienteResponse.from(clienteRepository.save(cliente));
    }

    @Transactional
    public void eliminar(Long id) {
        Cliente cliente = clienteRepository.findByIdAndActivoTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + id));
        cliente.setActivo(false);
        clienteRepository.save(cliente);
    }
}
