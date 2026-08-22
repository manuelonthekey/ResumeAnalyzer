package com.resumeflow.backend.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeflow.backend.model.InterviewFeedbackLog;
import com.resumeflow.backend.model.InterviewSession;
import com.resumeflow.backend.model.Resume;
import com.resumeflow.backend.model.ResumeAnalysis;
import com.resumeflow.backend.model.User;
import com.resumeflow.backend.repository.InterviewFeedbackLogRepository;
import com.resumeflow.backend.repository.InterviewSessionRepository;
import com.resumeflow.backend.repository.ResumeAnalysisRepository;
import com.resumeflow.backend.repository.ResumeRepository;
import com.resumeflow.backend.repository.UserRepository;
import com.resumeflow.backend.service.AffindaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.time.ZonedDateTime;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/resumes")
@CrossOrigin(origins = "*")
public class ResumeController {

    @Autowired
    private ResumeRepository resumeRepository;
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResumeAnalysisRepository resumeAnalysisRepository;
    
    @Autowired
    private InterviewSessionRepository interviewSessionRepository;
    
    @Autowired
    private InterviewFeedbackLogRepository interviewFeedbackLogRepository;

    @Autowired
    private AffindaService affindaService;
    
    @Autowired
    private ObjectMapper objectMapper;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadResume(Authentication authentication, @RequestParam("file") MultipartFile file) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail).orElseThrow();

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No file uploaded"));
        }

        try {
            Map<String, Object> parseResult = affindaService.parseResume(file);
            String rawText = (String) parseResult.get("rawText");
            Map<String, Object> parsedStructureMap = (Map<String, Object>) parseResult.get("parsedStructure");
            

            Resume resume = new Resume();
            resume.setUser(user);
            resume.setFilename(file.getOriginalFilename());
            resume.setRawText(rawText);
            resume.setParsedStructure(parsedStructureMap);
            resume.setIsDefault(false);
            resume.setUploadedAt(ZonedDateTime.now());

            Resume saved = resumeRepository.save(resume);

            Map<String, Object> response = new HashMap<>();
            response.put("resume_id", saved.getId().toString());
            response.put("parsed_structure", parsedStructureMap);

            return ResponseEntity.status(201).body(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getResumes(Authentication authentication) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail).orElseThrow();

        List<Resume> resumes = resumeRepository.findByUserIdOrderByUploadedAtDesc(user.getId());
        return ResponseEntity.ok(resumes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getResume(Authentication authentication, @PathVariable UUID id) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail).orElseThrow();

        Optional<Resume> resumeOpt = resumeRepository.findById(id);
        if (resumeOpt.isEmpty() || !resumeOpt.get().getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(404).body(Map.of("error", "Resume not found"));
        }

        return ResponseEntity.ok(resumeOpt.get());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteResume(Authentication authentication, @PathVariable UUID id) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail).orElseThrow();

        Optional<Resume> resumeOpt = resumeRepository.findById(id);
        if (resumeOpt.isEmpty() || !resumeOpt.get().getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(404).body(Map.of("error", "Resume not found"));
        }

        // Delete analyses
        List<ResumeAnalysis> analyses = resumeAnalysisRepository.findByResumeIdOrderByGeneratedAtDesc(id);
        resumeAnalysisRepository.deleteAll(analyses);

        // Delete interview sessions and logs
        List<InterviewSession> sessions = interviewSessionRepository.findByResumeId(id);
        for (InterviewSession s : sessions) {
            List<InterviewFeedbackLog> logs = interviewFeedbackLogRepository.findBySessionIdOrderByQuestionNumberAsc(s.getId());
            interviewFeedbackLogRepository.deleteAll(logs);
        }
        interviewSessionRepository.deleteAll(sessions);

        resumeRepository.delete(resumeOpt.get());

        return ResponseEntity.ok(Map.of("message", "Resume deleted successfully"));
    }
}
