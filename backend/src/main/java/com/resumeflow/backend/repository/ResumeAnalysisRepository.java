package com.resumeflow.backend.repository;

import com.resumeflow.backend.model.ResumeAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ResumeAnalysisRepository extends JpaRepository<ResumeAnalysis, UUID> {
    List<ResumeAnalysis> findByResumeId(UUID resumeId);
    java.util.List<com.resumeflow.backend.model.ResumeAnalysis> findByResumeIdOrderByGeneratedAtDesc(java.util.UUID resumeId);
    java.util.Optional<com.resumeflow.backend.model.ResumeAnalysis> findFirstByResumeIdAndJdTextHash(java.util.UUID resumeId, String jdTextHash);
}
