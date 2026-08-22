package com.resumeflow.backend.model;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "\"ResumeAnalysis\"")
public class ResumeAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Resume resume;

    @Column(name = "jd_text", columnDefinition = "TEXT")
    private String jdText;

    @Column(name = "jd_text_hash", length = 64)
    private String jdTextHash;

    @Type(JsonType.class)
    @Column(name = "analysis_result", columnDefinition = "jsonb")
    private Object analysisResult;

    @Column(name = "ats_score")
    private Integer atsScore;

    @Column(name = "generated_at")
    @CreationTimestamp
    private ZonedDateTime generatedAt;

    public ResumeAnalysis() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Resume getResume() { return resume; }
    public void setResume(Resume resume) { this.resume = resume; }
    public String getJdText() { return jdText; }
    public void setJdText(String jdText) { this.jdText = jdText; }
    public String getJdTextHash() { return jdTextHash; }
    public void setJdTextHash(String jdTextHash) { this.jdTextHash = jdTextHash; }
    public Object getAnalysisResult() { return analysisResult; }
    public void setAnalysisResult(Object analysisResult) { this.analysisResult = analysisResult; }
    public Integer getAtsScore() { return atsScore; }
    public void setAtsScore(Integer atsScore) { this.atsScore = atsScore; }
    public ZonedDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(ZonedDateTime generatedAt) { this.generatedAt = generatedAt; }
}
