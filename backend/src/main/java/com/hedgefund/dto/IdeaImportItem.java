package com.hedgefund.dto;

public class IdeaImportItem {
    /** Optional: use existing company by DB id */
    private Long companyId;
    /** Optional: look up or auto-create company by ticker (case-insensitive) */
    private String companyTicker;
    /** Used when auto-creating a company (if companyTicker not found in DB) */
    private String companyName;
    /** Required: BUY / SELL / HOLD / LONG / SHORT / MONITOR */
    private String action;
    /** Optional: short summary / one-liner */
    private String summary;
    /** Optional: full investment thesis (long-form original text from the document) */
    private String thesis;
    /** Optional: HIGH / MEDIUM / LOW */
    private String confidence;

    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }

    public String getCompanyTicker() { return companyTicker; }
    public void setCompanyTicker(String companyTicker) { this.companyTicker = companyTicker; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getThesis() { return thesis; }
    public void setThesis(String thesis) { this.thesis = thesis; }

    public String getConfidence() { return confidence; }
    public void setConfidence(String confidence) { this.confidence = confidence; }
}
