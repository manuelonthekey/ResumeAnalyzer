package com.resumeflow.backend.controller;

import com.resumeflow.backend.dto.AnswerRequestDto;
import com.resumeflow.backend.dto.StartInterviewRequestDto;
import com.resumeflow.backend.model.InterviewFeedbackLog;
import com.resumeflow.backend.model.InterviewSession;
import com.resumeflow.backend.model.Resume;
import com.resumeflow.backend.model.User;
import com.resumeflow.backend.repository.InterviewFeedbackLogRepository;
import com.resumeflow.backend.repository.InterviewSessionRepository;
import com.resumeflow.backend.repository.ResumeRepository;
import com.resumeflow.backend.repository.UserRepository;
import com.resumeflow.backend.service.InterviewCoachService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.ZonedDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/interviews")
@CrossOrigin(origins = "*")
public class InterviewController {

    @Autowired
    private InterviewSessionRepository interviewSessionRepository;
    
    @Autowired
    private InterviewFeedbackLogRepository interviewFeedbackLogRepository;
    
    @Autowired
    private ResumeRepository resumeRepository;
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InterviewCoachService interviewCoachService;

    @PostMapping("/start")
    public ResponseEntity<?> startInterview(Authentication authentication, @RequestBody StartInterviewRequestDto req) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail).orElseThrow();

        try {
            UUID resumeId = UUID.fromString(req.getResume_id());
            Optional<Resume> resumeOpt = resumeRepository.findById(resumeId);
            
            if (resumeOpt.isEmpty() || !resumeOpt.get().getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(404).body(Map.of("error", "Resume not found"));
            }

            InterviewSession session = new InterviewSession();
            session.setResume(resumeOpt.get());
            session.setUser(user);
            session.setSessionType(req.getSession_type());
            session.setQuestionCount(0);
            session.setStartedAt(ZonedDateTime.now());
            session.setDurationSeconds(0);
            
            InterviewSession savedSession = interviewSessionRepository.save(session);
            
            Map<String, Object> parsedStructure = (Map<String, Object>) resumeOpt.get().getParsedStructure();
            String firstQuestion = interviewCoachService.generateInterviewQuestion(parsedStructure, req.getSession_type(), 1, new ArrayList<>());

            Map<String, Object> response = new HashMap<>();
            response.put("session_id", savedSession.getId().toString());
            response.put("first_question", firstQuestion);
            
            return ResponseEntity.status(201).body(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{session_id}/answer")
    public ResponseEntity<?> answerQuestion(Authentication authentication, @PathVariable("session_id") UUID sessionId, @RequestBody AnswerRequestDto req) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail).orElseThrow();

        try {
            Optional<InterviewSession> sessionOpt = interviewSessionRepository.findById(sessionId);
            if (sessionOpt.isEmpty() || !sessionOpt.get().getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(404).body(Map.of("error", "Session not found"));
            }
            
            InterviewSession session = sessionOpt.get();
            Map<String, Object> parsedStructure = (Map<String, Object>) session.getResume().getParsedStructure();
            
            Map<String, Object> feedback = interviewCoachService.generateFeedbackOnAnswer(
                    req.getQuestion_text(),
                    req.getAnswer(),
                    parsedStructure,
                    session.getSessionType()
            );

            InterviewFeedbackLog log = new InterviewFeedbackLog();
            log.setSession(session);
            log.setQuestionNumber(req.getQuestion_number());
            log.setQuestionText(req.getQuestion_text());
            log.setUserAnswer(req.getAnswer());
            
            log.setFeedback(feedback);
            
            if (feedback.containsKey("score")) {
                Object score = feedback.get("score");
                if (score instanceof Number) {
                    log.setConfidenceScore(((Number) score).intValue());
                }
            }
            log.setCreatedAt(ZonedDateTime.now());
            
            interviewFeedbackLogRepository.save(log);
            
            session.setQuestionCount(session.getQuestionCount() + 1);
            interviewSessionRepository.save(session);

            List<InterviewFeedbackLog> logs = interviewFeedbackLogRepository.findBySessionIdOrderByQuestionNumberAsc(session.getId());
            List<Map<String, String>> previousAnswers = new ArrayList<>();
            for (InterviewFeedbackLog l : logs) {
                previousAnswers.add(Map.of(
                        "question", l.getQuestionText(),
                        "answer", l.getUserAnswer() != null ? l.getUserAnswer() : ""
                ));
            }
            
            String nextQuestion = interviewCoachService.generateInterviewQuestion(
                    parsedStructure,
                    session.getSessionType(),
                    req.getQuestion_number() + 1,
                    previousAnswers
            );

            Map<String, Object> response = new HashMap<>();
            response.put("feedback", feedback);
            response.put("next_question", nextQuestion);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{session_id}/end")
    public ResponseEntity<?> endSession(Authentication authentication, @PathVariable("session_id") UUID sessionId) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail).orElseThrow();

        try {
            Optional<InterviewSession> sessionOpt = interviewSessionRepository.findById(sessionId);
            if (sessionOpt.isEmpty() || !sessionOpt.get().getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(404).body(Map.of("error", "Session not found"));
            }
            
            InterviewSession session = sessionOpt.get();
            List<InterviewFeedbackLog> logs = interviewFeedbackLogRepository.findBySessionIdOrderByQuestionNumberAsc(session.getId());
            
            List<Map<String, Object>> logMaps = new ArrayList<>();
            for (InterviewFeedbackLog l : logs) {
                Map<String, Object> lm = new HashMap<>();
                lm.put("question_number", l.getQuestionNumber());
                lm.put("question_text", l.getQuestionText());
                lm.put("user_answer", l.getUserAnswer());
                lm.put("confidence_score", l.getConfidenceScore());
                logMaps.add(lm);
            }
            
            Map<String, Object> summary = interviewCoachService.generateSessionSummary(logMaps);
            
            Integer overallScore = null;
            if (!logs.isEmpty()) {
                int total = 0;
                for (InterviewFeedbackLog l : logs) {
                    total += l.getConfidenceScore() != null ? l.getConfidenceScore() : 0;
                }
                overallScore = Math.round((float) total / logs.size());
            }
            
            session.setEndedAt(ZonedDateTime.now());
            if (session.getStartedAt() != null) {
                long duration = session.getEndedAt().toEpochSecond() - session.getStartedAt().toEpochSecond();
                session.setDurationSeconds((int) duration);
            }
            session.setFeedbackSummary(summary);
            session.setOverallScore(overallScore);
            
            InterviewSession saved = interviewSessionRepository.save(session);
            
            return ResponseEntity.ok(saved);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(Authentication authentication) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        
        List<InterviewSession> sessions = interviewSessionRepository.findByUserIdOrderByStartedAtDesc(user.getId());
        return ResponseEntity.ok(sessions);
    }
    
    @GetMapping("/sessions")
    public ResponseEntity<?> getSessions(Authentication authentication) {
        return getHistory(authentication);
    }

    @GetMapping("/{session_id}")
    public ResponseEntity<?> getSession(Authentication authentication, @PathVariable("session_id") UUID sessionId) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail).orElseThrow();

        Optional<InterviewSession> sessionOpt = interviewSessionRepository.findById(sessionId);
        if (sessionOpt.isEmpty() || !sessionOpt.get().getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(404).body(Map.of("error", "Session not found"));
        }
        
        InterviewSession session = sessionOpt.get();
        List<InterviewFeedbackLog> logs = interviewFeedbackLogRepository.findBySessionIdOrderByQuestionNumberAsc(session.getId());
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", session.getId());
        response.put("resume_id", session.getResume().getId());
        response.put("session_type", session.getSessionType());
        response.put("started_at", session.getStartedAt());
        response.put("ended_at", session.getEndedAt());
        response.put("overall_score", session.getOverallScore());
        response.put("question_count", session.getQuestionCount());
        
        try {
            response.put("feedback_summary", session.getFeedbackSummary());
            
            List<Map<String, Object>> logList = new ArrayList<>();
            for (InterviewFeedbackLog l : logs) {
                Map<String, Object> lm = new HashMap<>();
                lm.put("id", l.getId());
                lm.put("question_number", l.getQuestionNumber());
                lm.put("question_text", l.getQuestionText());
                lm.put("user_answer", l.getUserAnswer());
                lm.put("confidence_score", l.getConfidenceScore());
                lm.put("feedback", l.getFeedback());
                logList.add(lm);
            }
            response.put("feedback_logs", logList);
            
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return ResponseEntity.ok(response);
    }
}
