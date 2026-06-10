package com.hedgefund.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class CategoryAddIdeasRequest {

    @NotEmpty
    private List<Long> ideaIds;

    public List<Long> getIdeaIds() { return ideaIds; }
    public void setIdeaIds(List<Long> ideaIds) { this.ideaIds = ideaIds; }
}
