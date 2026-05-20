package com.hedgefund.dto;

import com.hedgefund.model.Idea;
import java.time.LocalDateTime;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class IdeaDTO {
    private Long id;
    private Long documentId;
    private String documentTitle;
    private Long companyId;
    private String companyName;
    private String companyTicker;
    private String action;
    private String summary;
    private String thesis;
    private String confidence;
    private LocalDateTime createdAt;
    private Integer periodYear;
    private Integer periodQuarter;

    public static IdeaDTO from(Idea idea) {
        IdeaDTO dto = new IdeaDTO();
        dto.id = idea.getId();
        dto.documentId = idea.getDocument().getId();
        dto.documentTitle = idea.getDocument().getTitle();
        dto.companyId = idea.getCompany().getId();
        dto.companyName = idea.getCompany().getName();
        dto.companyTicker = idea.getCompany().getTicker();
        dto.action = idea.getAction().name();
        dto.summary = idea.getSummary();
        dto.thesis = idea.getThesis();
        dto.confidence = idea.getConfidence();
        dto.createdAt = idea.getCreatedAt();
        dto.periodYear = idea.getDocument().getPeriodYear();
        dto.periodQuarter = idea.getDocument().getPeriodQuarter();
        // Fall back to parsing the legacy period string when structured fields are absent
        if (dto.periodYear == null) {
            String legacyPeriod = idea.getDocument().getPeriod();
            if (legacyPeriod != null) {
                Matcher m = Pattern.compile("^(\\d{4})\\s*[Qq]([1-4])$").matcher(legacyPeriod.trim());
                if (m.matches()) {
                    dto.periodYear = Integer.valueOf(m.group(1));
                    dto.periodQuarter = Integer.valueOf(m.group(2));
                }
            }
        }
        return dto;
    }

    // Getters
    public Long getId() { return id; }
    public Long getDocumentId() { return documentId; }
    public String getDocumentTitle() { return documentTitle; }
    public Long getCompanyId() { return companyId; }
    public String getCompanyName() { return companyName; }
    public String getCompanyTicker() { return companyTicker; }
    public String getAction() { return action; }
    public String getSummary() { return summary; }
    public String getThesis() { return thesis; }
    public String getConfidence() { return confidence; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Integer getPeriodYear() { return periodYear; }
    public Integer getPeriodQuarter() { return periodQuarter; }
}
