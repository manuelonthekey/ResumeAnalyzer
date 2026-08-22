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

@Service
public class ResumeAnalyzerService {

    @Value("${app.openrouter.api-key}")
    private String openRouterApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, Object> analyzeResume(Map<String, Object> parsedResume, String jdText) {
        String resumeSummary = buildResumeSummary(parsedResume);
        
        String systemPrompt = "You are an expert resume reviewer. Analyze the resume and return ONLY valid JSON with no markdown, no explanation. Be specific and actionable.";
        String userPrompt = "Resume Summary:\n" + resumeSummary + "\n\n" +
                (jdText != null && !jdText.isEmpty() ? "Job Description:\n" + jdText.substring(0, Math.min(1500, jdText.length())) : "No job description provided.") +
                "\n\nReturn this exact JSON (no markdown fences, just raw JSON):\n" +
                "{\n" +
                "  \"overall_rating\": 7,\n" +
                "  \"summary\": \"2-3 sentence overall assessment\",\n" +
                "  \"strengths\": [\"specific strength 1\", \"specific strength 2\", \"specific strength 3\"],\n" +
                "  \"weaknesses\": [\"area 1\", \"area 2\"],\n" +
                "  \"suggestions\": [\n" +
                "    {\"section\": \"experience\", \"suggestion\": \"Add quantified impact numbers\"},\n" +
                "    {\"section\": \"skills\", \"suggestion\": \"Group by category\"}\n" +
                "  ],\n" +
                "  \"ats_keywords_missing\": [\"keyword1\", \"keyword2\"]\n" +
                "}";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openRouterApiKey);
        headers.set("HTTP-Referer", "http://localhost:8080");
        headers.set("X-Title", "ResumeFlow");

        Map<String, Object> requestBody = Map.of(
                "model", "openrouter/free",
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                ),
                "temperature", 0.4,
                "max_tokens", 1200
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            Map<String, Object> response = restTemplate.postForObject(
                    "https://openrouter.ai/api/v1/chat/completions",
                    request,
                    Map.class
            );

            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            String content = (String) ((Map<String, Object>) choices.get(0).get("message")).get("content");
            
            // Extract JSON from content
            int start = content.indexOf('{');
            int end = content.lastIndexOf('}');
            if (start != -1 && end != -1 && end >= start) {
                content = content.substring(start, end + 1);
            }
            
            return objectMapper.readValue(content, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("AI review failed: " + e.getMessage(), e);
        }
    }

    private String buildResumeSummary(Map<String, Object> parsed) {
        if (parsed == null) return "No resume data available.";
        // Implementation of summary builder omitted for brevity but mirrors the JS version
        try {
            return objectMapper.writeValueAsString(parsed); // Fallback mapping
        } catch (JsonProcessingException e) {
            return "No resume data available.";
        }
    }
}
