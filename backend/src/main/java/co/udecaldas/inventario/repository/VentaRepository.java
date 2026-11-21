package co.udecaldas.inventario.repository;

import co.udecaldas.inventario.entity.Venta;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface VentaRepository extends JpaRepository<Venta, Long> {

    @EntityGraph(attributePaths = {"cliente", "factura", "detalles", "detalles.producto"})
    List<Venta> findAllByOrderByFechaDesc();

    @EntityGraph(attributePaths = {"cliente", "factura", "detalles", "detalles.producto"})
    Optional<Venta> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {"cliente", "factura"})
    List<Venta> findTop5ByOrderByFechaDesc();

    long countByFechaBetween(LocalDateTime inicio, LocalDateTime fin);

    @Query("SELECT COALESCE(SUM(v.total), 0) FROM Venta v WHERE v.fecha BETWEEN :inicio AND :fin")
    BigDecimal sumTotalByFechaBetween(@Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);
}
