package com.resumeflow.backend.controller;

import com.resumeflow.backend.dto.AnalyzeRequestDto;
import com.resumeflow.backend.model.Resume;
import com.resumeflow.backend.model.ResumeAnalysis;
import com.resumeflow.backend.model.User;
import com.resumeflow.backend.repository.ResumeAnalysisRepository;
import com.resumeflow.backend.repository.ResumeRepository;
import com.resumeflow.backend.repository.UserRepository;
import com.resumeflow.backend.service.ResumeAnalyzerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/analysis")
@CrossOrigin(origins = "*")
public class AnalysisController {

    @Autowired
    private ResumeRepository resumeRepository;
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResumeAnalysisRepository resumeAnalysisRepository;
    
    @Autowired
    private ResumeAnalyzerService resumeAnalyzerService;

    private String hash(String text) {
        if (text == null) text = "";
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * encodedhash.length);
            for (byte b : encodedhash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return String.valueOf(text.hashCode());
        }
    }

    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeResume(Authentication authentication, @RequestBody AnalyzeRequestDto req) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail).orElseThrow();

        try {
            UUID resumeId = UUID.fromString(req.getResume_id());
            String jdTextHash = hash(req.getJd_text());

            Optional<ResumeAnalysis> cachedOpt = resumeAnalysisRepository.findFirstByResumeIdAndJdTextHash(resumeId, jdTextHash);
            if (cachedOpt.isPresent() && cachedOpt.get().getAnalysisResult() != null) {
                return ResponseEntity.ok(cachedOpt.get());
            }

            Optional<Resume> resumeOpt = resumeRepository.findById(resumeId);
            if (resumeOpt.isEmpty() || !resumeOpt.get().getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(404).body(Map.of("error", "Resume not found"));
            }
            
            Resume resume = resumeOpt.get();
            Map<String, Object> parsedStructure = (Map<String, Object>) resume.getParsedStructure();
            
            Map<String, Object> analysis = resumeAnalyzerService.analyzeResume(parsedStructure, req.getJd_text());
            
            ResumeAnalysis resumeAnalysis = new ResumeAnalysis();
            resumeAnalysis.setResume(resume);
            resumeAnalysis.setJdText(req.getJd_text());
            resumeAnalysis.setJdTextHash(jdTextHash);
            
            resumeAnalysis.setAnalysisResult(analysis);
            
            Integer atsScore = null;
            if (analysis.containsKey("overall_rating")) {
                Object or = analysis.get("overall_rating");
                if (or instanceof Number) {
                    atsScore = Math.round(((Number) or).floatValue() * 10);
                }
            } else if (analysis.containsKey("jd_match_score")) {
                Object or = analysis.get("jd_match_score");
                if (or instanceof Number) {
                    atsScore = Math.round(((Number) or).floatValue() * 100);
                }
            }
            resumeAnalysis.setAtsScore(atsScore);
            resumeAnalysis.setGeneratedAt(ZonedDateTime.now());

            ResumeAnalysis saved = resumeAnalysisRepository.save(resumeAnalysis);
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{resume_id}")
    public ResponseEntity<?> getAnalyses(Authentication authentication, @PathVariable("resume_id") UUID resumeId) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail).orElseThrow();

        Optional<Resume> resumeOpt = resumeRepository.findById(resumeId);
        if (resumeOpt.isEmpty() || !resumeOpt.get().getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(404).body(Map.of("error", "Resume not found"));
        }

        List<ResumeAnalysis> analyses = resumeAnalysisRepository.findByResumeIdOrderByGeneratedAtDesc(resumeId);
        return ResponseEntity.ok(analyses);
    }
}
