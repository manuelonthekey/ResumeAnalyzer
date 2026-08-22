package com.resumeflow.backend.dto;

public class StartInterviewRequestDto {
    private String resume_id;
    private String session_type;

    public String getResume_id() { return resume_id; }
    public void setResume_id(String resume_id) { this.resume_id = resume_id; }
    
    public String getSession_type() { return session_type; }
    public void setSession_type(String session_type) { this.session_type = session_type; }
}
