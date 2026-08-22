package com.resumeflow.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class InterviewCoachService {

    @Value("${app.openrouter.api-key}")
    private String openRouterApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
    private final String MODEL = "openrouter/free";

    private String callOpenRouter(List<Map<String, String>> messages, int maxTokens, double temperature) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openRouterApiKey);
        headers.set("HTTP-Referer", "http://localhost:8080");
        headers.set("X-Title", "ResumeFlow");

        Map<String, Object> requestBody = Map.of(
                "model", MODEL,
                "messages", messages,
                "temperature", temperature,
                "max_tokens", maxTokens
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        Map<String, Object> response = restTemplate.postForObject(
                OPENROUTER_BASE_URL + "/chat/completions",
                request,
                Map.class
        );

        List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
        return (String) ((Map<String, Object>) choices.get(0).get("message")).get("content");
    }

    private Map<String, Object> parseJSON(String text) throws Exception {
        String content = text;
        int start = content.indexOf('{');
        int end = content.lastIndexOf('}');
        if (start != -1 && end != -1 && end >= start) {
            content = content.substring(start, end + 1);
        }
        return objectMapper.readValue(content, Map.class);
    }

    private String buildInterviewContext(Map<String, Object> parsed) {
        if (parsed == null) return "Candidate resume not available.";
        try {
            return objectMapper.writeValueAsString(parsed);
        } catch (JsonProcessingException e) {
            return "Failed to stringify resume.";
        }
    }

    public String generateInterviewQuestion(Map<String, Object> resumeStructure, String sessionType, int questionNumber, List<Map<String, String>> previousAnswers) throws Exception {
        String resumeContext = buildInterviewContext(resumeStructure);

        String previousContext = "(first question - set the stage)";
        if (previousAnswers != null && !previousAnswers.isEmpty()) {
            previousContext = previousAnswers.stream()
                    .map(a -> "Q: " + a.get("question") + "\nA: " + a.get("answer"))
                    .collect(Collectors.joining("\n\n"));
        }

        String typeGuidance = "Ask a relevant interview question based on their background.";
        if ("behavioral".equals(sessionType)) {
            typeGuidance = "Ask about specific situations from their work experience using STAR method. Reference actual job titles.";
        } else if ("technical".equals(sessionType)) {
            typeGuidance = "Ask a technical question directly tied to their listed skills and tech stack. Test depth of understanding.";
        } else if ("management".equals(sessionType)) {
            typeGuidance = "Ask a management question about strategy, leadership, or prioritization relevant to their specific background.";
        }

        String systemPrompt = "You are an expert technical recruiter conducting a mock interview. " +
                "Given the candidate's resume summary, generate EXACTLY ONE highly specific interview question. " +
                "The question MUST directly reference a specific project, past role, or technical skill from the provided resume. " +
                "Return ONLY a JSON object: {\"question\": \"...\"}";
        String userPrompt = resumeContext + "\n\nPrior conversation:\n" + previousContext + "\n\nInstructions: " + typeGuidance + "\nGenerate question #" + questionNumber + ". Make it specific to this candidate's actual experience. ONLY return the question text.";

        String responseText = callOpenRouter(
                List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                ),
                200,
                0.75
        );

        String question = "";
        try {
            Map<String, Object> jsonMap = parseJSON(responseText);
            if (jsonMap.containsKey("question")) {
                question = (String) jsonMap.get("question");
            } else {
                question = responseText;
            }
        } catch (Exception e) {
            question = responseText;
        }

        if (question == null || question.isEmpty()) {
            question = "Could you tell me more about your experience?";
        }

        question = question.replaceAll("^(?i)(Question\\s*#?\\d*:?\\s*|Q\\d+:?\\s*|\")", "");
        question = question.replaceAll("\"$", "");
        return question.trim();
    }

    public Map<String, Object> generateFeedbackOnAnswer(String question, String userAnswer, Map<String, Object> resumeStructure, String sessionType) throws Exception {
        String systemPrompt = "You are an expert " + sessionType + " interviewer evaluating a candidate's answer. Return ONLY valid JSON - no markdown fences, no explanation.";
        String userPrompt = "Question: \"" + question + "\"\nAnswer: \"" + (userAnswer != null ? userAnswer : "") + "\"\n\nEvaluate the answer on clarity, specificity, and depth.\n\nReturn this JSON exactly:\n" +
                "{\n" +
                "  \"score\": 72,\n" +
                "  \"strengths\": [\"clear structure\", \"referenced specific project\"],\n" +
                "  \"weaknesses\": [\"missing quantified results\", \"too brief\"],\n" +
                "  \"suggestion\": \"One concrete tip to improve this answer next time\",\n" +
                "  \"follow_up_question\": \"A natural follow-up question based on their answer\"\n" +
                "}";

        String text = callOpenRouter(
                List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                ),
                800,
                0.4
        );
        return parseJSON(text);
    }

    public Map<String, Object> generateSessionSummary(List<Map<String, Object>> logs) throws Exception {
        if (logs == null || logs.isEmpty()) {
            return Map.of(
                    "overall_summary", "No answers were recorded in this session.",
                    "key_strengths", List.of(),
                    "key_weaknesses", List.of(),
                    "action_items", List.of("Complete at least one question in your next session")
            );
        }

        double totalScore = 0;
        StringBuilder history = new StringBuilder();
        for (Map<String, Object> log : logs) {
            int score = (Integer) log.getOrDefault("confidence_score", 0);
            totalScore += score;
            history.append("Q").append(log.get("question_number")).append(": ").append(log.get("question_text"))
                    .append("\nAnswer: ").append(log.get("user_answer"))
                    .append("\nScore: ").append(score).append("/100\n\n");
        }
        long avgScore = Math.round(totalScore / logs.size());

        String systemPrompt = "You are an expert interviewer giving a final debrief. Return ONLY valid JSON.";
        String userPrompt = "Session transcript:\n" + history.toString() + "\nAverage score: " + avgScore + "/100\n\nProvide a final debrief. Return this JSON exactly:\n" +
                "{\n" +
                "  \"overall_summary\": \"2-3 sentence holistic assessment of the session\",\n" +
                "  \"key_strengths\": [\"strength 1\", \"strength 2\", \"strength 3\"],\n" +
                "  \"key_weaknesses\": [\"weakness 1\", \"weakness 2\"],\n" +
                "  \"action_items\": [\"specific action 1\", \"specific action 2\", \"specific action 3\"]\n" +
                "}";

        String text = callOpenRouter(
                List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                ),
                1200,
                0.4
        );
        return parseJSON(text);
    }
}
