package com.hedgefund.repository;

import com.hedgefund.model.Idea;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IdeaRepository extends JpaRepository<Idea, Long> {
    List<Idea> findByDocumentId(Long documentId);
    List<Idea> findByCompanyId(Long companyId);
    List<Idea> findByCompanyIdOrderByCreatedAtDesc(Long companyId);
    List<Idea> findAllByOrderByCreatedAtDesc();
    long countByDocumentId(Long documentId);
    long countByCompanyId(Long companyId);
}
