package co.udecaldas.inventario.repository;

import co.udecaldas.inventario.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductoRepository extends JpaRepository<Producto, Long> {

    List<Producto> findByActivoTrueOrderByNombreAsc();

    Optional<Producto> findByIdAndActivoTrue(Long id);

    boolean existsBySkuIgnoreCase(String sku);

    boolean existsBySkuIgnoreCaseAndIdNot(String sku, Long id);

    @Query("""
            SELECT p FROM Producto p
            WHERE p.activo = true
              AND p.stockActual <= p.stockMinimo
            ORDER BY p.stockActual ASC, p.nombre ASC
            """)
    List<Producto> findStockBajo();

    @Query("""
            SELECT p FROM Producto p
            WHERE p.activo = true
              AND (LOWER(p.nombre) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(p.categoria) LIKE LOWER(CONCAT('%', :q, '%')))
            ORDER BY p.nombre ASC
            """)
    List<Producto> buscarActivos(@Param("q") String q);

    long countByActivoTrue();
}
