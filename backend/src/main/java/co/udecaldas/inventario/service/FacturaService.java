package co.udecaldas.inventario.service;

import co.udecaldas.inventario.dto.FacturaResponse;
import co.udecaldas.inventario.entity.Factura;
import co.udecaldas.inventario.exception.ResourceNotFoundException;
import co.udecaldas.inventario.repository.FacturaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FacturaService {

    private final FacturaRepository facturaRepository;

    @Transactional(readOnly = true)
    public List<FacturaResponse> listarTodas() {
        return facturaRepository.findAllByOrderByFechaEmisionDesc().stream()
                .map(FacturaResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public FacturaResponse obtenerPorId(Long id) {
        Factura factura = facturaRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Factura no encontrada con ID: " + id));
        return FacturaResponse.from(factura);
    }
}
