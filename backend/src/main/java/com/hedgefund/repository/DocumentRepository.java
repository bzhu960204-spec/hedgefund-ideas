package com.hedgefund.repository;

import com.hedgefund.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByTitleContainingIgnoreCaseOrSourceContainingIgnoreCase(String title, String source);
    List<Document> findAllByOrderByUploadTimeDesc();
}
