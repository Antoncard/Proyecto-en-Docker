package co.udecaldas.inventario.repository;

import co.udecaldas.inventario.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    List<Cliente> findByActivoTrueOrderByNombreAsc();

    Optional<Cliente> findByIdAndActivoTrue(Long id);

    boolean existsByDocumentoIgnoreCase(String documento);

    boolean existsByDocumentoIgnoreCaseAndIdNot(String documento, Long id);

    @Query("""
            SELECT c FROM Cliente c
            WHERE c.activo = true
              AND (LOWER(c.nombre) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(c.documento) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(c.email) LIKE LOWER(CONCAT('%', :q, '%')))
            ORDER BY c.nombre ASC
            """)
    List<Cliente> buscarActivos(@Param("q") String q);

    long countByActivoTrue();
}
