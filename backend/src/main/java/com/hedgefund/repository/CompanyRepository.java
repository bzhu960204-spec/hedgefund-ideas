package com.hedgefund.repository;

import com.hedgefund.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Long> {
    List<Company> findByNameContainingIgnoreCaseOrTickerContainingIgnoreCase(String name, String ticker);
    Optional<Company> findByTickerIgnoreCase(String ticker);
    List<Company> findAllByOrderByNameAsc();
}
