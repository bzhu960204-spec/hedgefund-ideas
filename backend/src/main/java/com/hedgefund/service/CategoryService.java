package com.hedgefund.service;

import com.hedgefund.exception.ResourceNotFoundException;
import com.hedgefund.model.Category;
import com.hedgefund.model.Idea;
import com.hedgefund.repository.CategoryRepository;
import com.hedgefund.repository.IdeaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final IdeaRepository ideaRepository;

    public CategoryService(CategoryRepository categoryRepository, IdeaRepository ideaRepository) {
        this.categoryRepository = categoryRepository;
        this.ideaRepository = ideaRepository;
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Category> getCategoriesByIdea(Long ideaId) {
        return categoryRepository.findByIdeas_Id(ideaId);
    }

    public Category getCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
    }

    public Category createCategory(String name, String description) {
        Category category = new Category();
        category.setName(name);
        category.setDescription(description);
        return categoryRepository.save(category);
    }

    public Category updateCategory(Long id, String name, String description) {
        Category category = getCategory(id);
        if (name != null) category.setName(name);
        if (description != null) category.setDescription(description);
        return categoryRepository.save(category);
    }

    @Transactional
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Category", id);
        }
        categoryRepository.deleteById(id);
    }

    @Transactional
    public Category addIdea(Long categoryId, Long ideaId) {
        Category category = getCategory(categoryId);
        Idea idea = ideaRepository.findById(ideaId)
                .orElseThrow(() -> new ResourceNotFoundException("Idea", ideaId));
        category.getIdeas().add(idea);
        return categoryRepository.save(category);
    }

    @Transactional
    public Category removeIdea(Long categoryId, Long ideaId) {
        Category category = getCategory(categoryId);
        category.getIdeas().removeIf(i -> i.getId().equals(ideaId));
        return categoryRepository.save(category);
    }

    @Transactional
    public Category addIdeas(Long categoryId, List<Long> ideaIds) {
        Category category = getCategory(categoryId);
        List<Idea> ideas = ideaRepository.findAllById(ideaIds);
        category.getIdeas().addAll(ideas);
        return categoryRepository.save(category);
    }
}
