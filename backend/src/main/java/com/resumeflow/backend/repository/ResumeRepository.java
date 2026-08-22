package com.resumeflow.backend.repository;

import com.resumeflow.backend.model.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, UUID> {
    List<Resume> findByUserId(UUID userId);
    Optional<Resume> findByIdAndUserId(UUID id, UUID userId);
    java.util.List<com.resumeflow.backend.model.Resume> findByUserIdOrderByUploadedAtDesc(java.util.UUID userId);
}
