package com.hedgefund.dto;

import com.hedgefund.model.Category;

import java.time.LocalDateTime;

public class CategoryDTO {
    private Long id;
    private String name;
    private String description;
    private int ideaCount;
    private LocalDateTime createdAt;

    public static CategoryDTO from(Category category) {
        CategoryDTO dto = new CategoryDTO();
        dto.id = category.getId();
        dto.name = category.getName();
        dto.description = category.getDescription();
        dto.ideaCount = category.getIdeas().size();
        dto.createdAt = category.getCreatedAt();
        return dto;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getIdeaCount() { return ideaCount; }
    public void setIdeaCount(int ideaCount) { this.ideaCount = ideaCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
