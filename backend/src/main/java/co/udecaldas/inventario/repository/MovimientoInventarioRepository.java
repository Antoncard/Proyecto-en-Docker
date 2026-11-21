package co.udecaldas.inventario.repository;

import co.udecaldas.inventario.entity.MovimientoInventario;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovimientoInventarioRepository extends JpaRepository<MovimientoInventario, Long> {

    @EntityGraph(attributePaths = {"producto"})
    List<MovimientoInventario> findAllByOrderByFechaDesc();

    @EntityGraph(attributePaths = {"producto"})
    List<MovimientoInventario> findByProductoIdOrderByFechaDesc(Long productoId);
}
