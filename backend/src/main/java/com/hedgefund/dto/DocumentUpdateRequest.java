package com.hedgefund.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public class DocumentUpdateRequest {

    @Size(max = 500)
    private String title;

    @Size(max = 200)
    private String source;

    @Min(1900)
    @Max(2100)
    private Integer periodYear;

    @Min(1)
    @Max(4)
    private Integer periodQuarter;

    private String notes;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public Integer getPeriodYear() { return periodYear; }
    public void setPeriodYear(Integer periodYear) { this.periodYear = periodYear; }

    public Integer getPeriodQuarter() { return periodQuarter; }
    public void setPeriodQuarter(Integer periodQuarter) { this.periodQuarter = periodQuarter; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
