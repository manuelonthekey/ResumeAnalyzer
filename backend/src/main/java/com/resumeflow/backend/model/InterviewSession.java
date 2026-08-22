package com.resumeflow.backend.model;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "\"InterviewSession\"")
public class InterviewSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Resume resume;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User user;

    @Column(name = "session_type", nullable = false, length = 20)
    private String sessionType;

    @Column(name = "question_count", nullable = false)
    private Integer questionCount = 0;

    @Column(name = "duration_seconds", nullable = false)
    private Integer durationSeconds = 0;

    @Column(name = "overall_score")
    private Integer overallScore;

    @Column(name = "started_at")
    @CreationTimestamp
    private ZonedDateTime startedAt;

    @Column(name = "ended_at")
    private ZonedDateTime endedAt;

    @Type(JsonType.class)
    @Column(name = "feedback_summary", columnDefinition = "jsonb")
    private Object feedbackSummary;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL)
    private List<InterviewFeedbackLog> feedbackLogs;

    public InterviewSession() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Resume getResume() { return resume; }
    public void setResume(Resume resume) { this.resume = resume; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getSessionType() { return sessionType; }
    public void setSessionType(String sessionType) { this.sessionType = sessionType; }
    public Integer getQuestionCount() { return questionCount; }
    public void setQuestionCount(Integer questionCount) { this.questionCount = questionCount; }
    public Integer getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Integer durationSeconds) { this.durationSeconds = durationSeconds; }
    public Integer getOverallScore() { return overallScore; }
    public void setOverallScore(Integer overallScore) { this.overallScore = overallScore; }
    public ZonedDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(ZonedDateTime startedAt) { this.startedAt = startedAt; }
    public ZonedDateTime getEndedAt() { return endedAt; }
    public void setEndedAt(ZonedDateTime endedAt) { this.endedAt = endedAt; }
    public Object getFeedbackSummary() { return feedbackSummary; }
    public void setFeedbackSummary(Object feedbackSummary) { this.feedbackSummary = feedbackSummary; }
    public List<InterviewFeedbackLog> getFeedbackLogs() { return feedbackLogs; }
    public void setFeedbackLogs(List<InterviewFeedbackLog> feedbackLogs) { this.feedbackLogs = feedbackLogs; }
}
