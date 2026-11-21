package co.udecaldas.inventario.repository;

import co.udecaldas.inventario.entity.Factura;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FacturaRepository extends JpaRepository<Factura, Long> {

    @EntityGraph(attributePaths = {"venta", "venta.cliente", "venta.detalles", "venta.detalles.producto"})
    List<Factura> findAllByOrderByFechaEmisionDesc();

    @EntityGraph(attributePaths = {"venta", "venta.cliente", "venta.detalles", "venta.detalles.producto"})
    Optional<Factura> findWithDetailsById(Long id);
}
