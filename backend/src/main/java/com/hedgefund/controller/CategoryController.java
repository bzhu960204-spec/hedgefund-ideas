package com.hedgefund.controller;

import com.hedgefund.dto.CategoryDTO;
import com.hedgefund.dto.IdeaDTO;
import com.hedgefund.model.Category;
import com.hedgefund.service.CategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<List<CategoryDTO>> getAllCategories() {
        return ResponseEntity.ok(
            categoryService.getAllCategories().stream()
                .map(CategoryDTO::from)
                .collect(Collectors.toList())
        );
    }

    @GetMapping("/by-idea/{ideaId}")
    public ResponseEntity<List<CategoryDTO>> getCategoriesByIdea(@PathVariable Long ideaId) {
        return ResponseEntity.ok(
            categoryService.getCategoriesByIdea(ideaId).stream()
                .map(CategoryDTO::from)
                .collect(Collectors.toList())
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryDTO> getCategory(@PathVariable Long id) {
        return ResponseEntity.ok(CategoryDTO.from(categoryService.getCategory(id)));
    }

    @GetMapping("/{id}/ideas")
    public ResponseEntity<List<IdeaDTO>> getCategoryIdeas(@PathVariable Long id) {
        Category category = categoryService.getCategory(id);
        List<IdeaDTO> ideas = category.getIdeas().stream()
                .map(IdeaDTO::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ideas);
    }

    @PostMapping
    public ResponseEntity<CategoryDTO> createCategory(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String description = body.get("description");
        Category category = categoryService.createCategory(name, description);
        return ResponseEntity.ok(CategoryDTO.from(category));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryDTO> updateCategory(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String name = body.get("name");
        String description = body.get("description");
        return ResponseEntity.ok(CategoryDTO.from(categoryService.updateCategory(id, name, description)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/ideas")
    public ResponseEntity<CategoryDTO> addIdeas(@PathVariable Long id, @RequestBody Map<String, List<Long>> body) {
        List<Long> ideaIds = body.get("ideaIds");
        return ResponseEntity.ok(CategoryDTO.from(categoryService.addIdeas(id, ideaIds)));
    }

    @DeleteMapping("/{id}/ideas/{ideaId}")
    public ResponseEntity<CategoryDTO> removeIdea(@PathVariable Long id, @PathVariable Long ideaId) {
        return ResponseEntity.ok(CategoryDTO.from(categoryService.removeIdea(id, ideaId)));
    }
}
