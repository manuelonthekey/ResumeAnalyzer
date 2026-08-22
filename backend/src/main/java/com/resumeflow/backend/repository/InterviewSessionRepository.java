package com.resumeflow.backend.repository;

import com.resumeflow.backend.model.InterviewSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, UUID> {
    List<InterviewSession> findByUserId(UUID userId);
    Optional<InterviewSession> findByIdAndUserId(UUID id, UUID userId);
    java.util.List<com.resumeflow.backend.model.InterviewSession> findByResumeId(java.util.UUID resumeId);
    java.util.List<com.resumeflow.backend.model.InterviewSession> findByUserIdOrderByStartedAtDesc(java.util.UUID userId);
}
