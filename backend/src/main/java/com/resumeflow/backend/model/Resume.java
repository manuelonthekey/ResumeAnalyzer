package com.resumeflow.backend.model;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "\"Resume\"")
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User user;

    @Column(nullable = false, length = 255)
    private String filename;

    @Column(name = "raw_text", columnDefinition = "TEXT")
    private String rawText;

    @Type(JsonType.class)
    @Column(name = "parsed_structure", columnDefinition = "jsonb")
    private Object parsedStructure;

    @Column(name = "pdf_storage_url", length = 512)
    private String pdfStorageUrl;

    @Column(name = "version_name", length = 100)
    private String versionName;

    @Column(name = "uploaded_at")
    @CreationTimestamp
    private ZonedDateTime uploadedAt;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @OneToMany(mappedBy = "resume", cascade = CascadeType.ALL)
    private List<ResumeAnalysis> analyses;

    @OneToMany(mappedBy = "resume", cascade = CascadeType.ALL)
    private List<InterviewSession> interviewSessions;

    public Resume() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }
    public String getRawText() { return rawText; }
    public void setRawText(String rawText) { this.rawText = rawText; }
    public Object getParsedStructure() { return parsedStructure; }
    public void setParsedStructure(Object parsedStructure) { this.parsedStructure = parsedStructure; }
    public String getPdfStorageUrl() { return pdfStorageUrl; }
    public void setPdfStorageUrl(String pdfStorageUrl) { this.pdfStorageUrl = pdfStorageUrl; }
    public String getVersionName() { return versionName; }
    public void setVersionName(String versionName) { this.versionName = versionName; }
    public ZonedDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(ZonedDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
    public Boolean getIsDefault() { return isDefault; }
    public void setIsDefault(Boolean isDefault) { this.isDefault = isDefault; }
    public List<ResumeAnalysis> getAnalyses() { return analyses; }
    public void setAnalyses(List<ResumeAnalysis> analyses) { this.analyses = analyses; }
    public List<InterviewSession> getInterviewSessions() { return interviewSessions; }
    public void setInterviewSessions(List<InterviewSession> interviewSessions) { this.interviewSessions = interviewSessions; }
}
