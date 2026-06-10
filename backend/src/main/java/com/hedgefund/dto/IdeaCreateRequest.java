package com.hedgefund.dto;

import com.hedgefund.model.Idea;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class IdeaCreateRequest {

    @NotNull
    private Long documentId;

    @NotNull
    private Long companyId;

    @NotNull
    private Idea.Action action;

    @Size(max = 2000)
    private String summary;

    private String thesis;

    @Size(max = 20)
    private String confidence;

    public Long getDocumentId() { return documentId; }
    public void setDocumentId(Long documentId) { this.documentId = documentId; }

    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }

    public Idea.Action getAction() { return action; }
    public void setAction(Idea.Action action) { this.action = action; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getThesis() { return thesis; }
    public void setThesis(String thesis) { this.thesis = thesis; }

    public String getConfidence() { return confidence; }
    public void setConfidence(String confidence) { this.confidence = confidence; }
}
