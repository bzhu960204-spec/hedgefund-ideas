package com.hedgefund.repository;

import com.hedgefund.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findAllByOrderByCreatedAtDesc();
    List<Category> findByIdeas_Id(Long ideaId);
}
