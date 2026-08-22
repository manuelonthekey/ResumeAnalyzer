package com.resumeflow.backend.repository;

import com.resumeflow.backend.model.InterviewFeedbackLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InterviewFeedbackLogRepository extends JpaRepository<InterviewFeedbackLog, UUID> {
    List<InterviewFeedbackLog> findBySessionId(UUID sessionId);
    java.util.List<com.resumeflow.backend.model.InterviewFeedbackLog> findBySessionIdOrderByQuestionNumberAsc(java.util.UUID sessionId);
}
