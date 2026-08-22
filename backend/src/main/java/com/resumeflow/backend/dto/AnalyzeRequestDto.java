package com.resumeflow.backend.dto;

public class AnalyzeRequestDto {
    private String resume_id;
    private String jd_text;

    public String getResume_id() { return resume_id; }
    public void setResume_id(String resume_id) { this.resume_id = resume_id; }

    public String getJd_text() { return jd_text; }
    public void setJd_text(String jd_text) { this.jd_text = jd_text; }
}
