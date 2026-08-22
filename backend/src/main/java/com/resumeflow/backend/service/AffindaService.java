package com.resumeflow.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AffindaService {

    @Value("${app.affinda.api-key:dummy_key}")
    private String affindaApiKey;

    @Value("${app.affinda.collection-id:dummy_collection}")
    private String affindaCollectionId;

    @Value("${app.affinda.workspace-id:dummy_workspace}")
    private String affindaWorkspaceId;

    private final String AFFINDA_BASE_URL = "https://api.affinda.com/v3";
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, Object> parseResume(MultipartFile file) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setBearerAuth(affindaApiKey);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename() != null ? file.getOriginalFilename() : "resume.pdf";
            }
        });
        
        if (affindaCollectionId != null && !affindaCollectionId.trim().isEmpty() && !affindaCollectionId.equals("dummy_collection")) {
            body.add("collection", affindaCollectionId.trim());
        }

        if (affindaWorkspaceId != null && !affindaWorkspaceId.trim().isEmpty() && !affindaWorkspaceId.equals("dummy_workspace")) {
            body.add("workspace", affindaWorkspaceId.trim());
        }

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        Map<String, Object> uploadResponse;
        try {
            uploadResponse = restTemplate.postForObject(
                    AFFINDA_BASE_URL + "/documents",
                    requestEntity,
                    Map.class
            );
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            String errorBody = e.getResponseBodyAsString();
            System.err.println("Affinda Error Body: " + errorBody);
            throw new Exception("Affinda upload failed with status " + e.getStatusCode() + ": " + errorBody, e);
        } catch (Exception e) {
            throw new Exception("Affinda upload failed: " + e.getMessage(), e);
        }

        String documentId = null;
        if (uploadResponse != null) {
            if (uploadResponse.containsKey("meta")) {
                Map<String, Object> meta = (Map<String, Object>) uploadResponse.get("meta");
                documentId = (String) meta.get("identifier");
            }
            if (documentId == null) {
                documentId = (String) uploadResponse.get("identifier");
            }
        }

        if (documentId == null) {
            throw new Exception("No document identifier returned by Affinda.");
        }

        Map<String, Object> affindaDoc = waitForProcessing(documentId);
        
        Map<String, Object> data = (Map<String, Object>) affindaDoc.getOrDefault("data", new HashMap<>());
        String rawText = (String) data.getOrDefault("rawText", "");

        Map<String, Object> parsedStructure = normalizeAffindaOutput(data, rawText);

        Map<String, Object> result = new HashMap<>();
        result.put("rawText", rawText);
        result.put("parsedStructure", parsedStructure);
        
        return result;
    }

    private Map<String, Object> waitForProcessing(String documentId) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(affindaApiKey);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        for (int i = 0; i < 30; i++) {
            ResponseEntity<Map> response = restTemplate.exchange(
                    AFFINDA_BASE_URL + "/documents/" + documentId,
                    HttpMethod.GET,
                    request,
                    Map.class
            );
            Map<String, Object> doc = response.getBody();
            
            boolean isReady = false;
            if (doc != null) {
                Map<String, Object> meta = (Map<String, Object>) doc.get("meta");
                if (meta != null) {
                    if (meta.containsKey("isReady") && meta.get("isReady") != null) {
                        isReady = (Boolean) meta.get("isReady");
                    } else if (meta.containsKey("ready") && meta.get("ready") != null) {
                        isReady = (Boolean) meta.get("ready");
                    }
                }
                
                if (!isReady && doc.containsKey("data") && doc.get("data") != null) {
                    isReady = true;
                }
                
                if (isReady) {
                    return doc;
                }
            }
            Thread.sleep(2000);
        }
        throw new Exception("Affinda parsing timed out after 60 seconds.");
    }

    private String safeStr(Object val) {
        if (val == null) return "";
        if (val instanceof String) return ((String) val).trim();
        if (val instanceof Map) {
            Map m = (Map) val;
            if (m.containsKey("raw")) return safeStr(m.get("raw"));
            if (m.containsKey("parsed")) return safeStr(m.get("parsed"));
        }
        return val.toString().trim();
    }

    private List<String> extractKeywordsFromText(String text) {
        if (text == null || text.isEmpty()) return new ArrayList<>();
        Set<String> stopWords = new HashSet<>(Arrays.asList(
                "a","an","the","and","or","but","in","on","at","to","for","of","with",
                "by","from","up","about","into","through","during","is","was","are",
                "were","be","been","being","have","has","had","do","does","did","will",
                "would","could","should","may","might","shall","can","need","dare","ought",
                "used","able","i","we","you","he","she","they","it","its","my","our",
                "your","his","her","their","this","that","these","those","as","if","when",
                "where","while","who","which","what","how","then","than","so","yet","both",
                "each","more","most","other","some","such","no","nor","not","only","own",
                "same","very","just","also","well","new","across","within","using","via",
                "across","various","multiple","several","many","including"
        ));
        String cleaned = text.replaceAll("[^\\w\\s]", " ").toLowerCase();
        return Arrays.stream(cleaned.split("\\s+"))
                .filter(w -> w.length() > 3 && !stopWords.contains(w))
                .distinct()
                .collect(Collectors.toList());
    }

    private Map<String, Object> normalizeAffindaOutput(Map<String, Object> data, String rawText) {
        List<Object> allSkillsObj = (List<Object>) data.getOrDefault("skills", new ArrayList<>());
        List<String> languages = new ArrayList<>();
        List<String> frameworks = new ArrayList<>();
        List<String> tools = new ArrayList<>();
        List<String> other = new ArrayList<>();

        for (Object s : allSkillsObj) {
            if (!(s instanceof Map)) continue;
            Map<String, Object> sMap = (Map<String, Object>) s;
            String name = safeStr(sMap.get("name"));
            if (name.isEmpty()) continue;
            String type = safeStr(sMap.get("type")).toLowerCase();
            
            if (Arrays.asList("programming language", "language", "programming_language").contains(type)) {
                languages.add(name);
            } else if (Arrays.asList("framework", "library", "framework/library").contains(type)) {
                frameworks.add(name);
            } else if (Arrays.asList("tool", "software", "platform", "database").contains(type)) {
                tools.add(name);
            } else {
                other.add(name);
            }
        }

        List<Map<String, Object>> rawExp = (List<Map<String, Object>>) data.getOrDefault("workExperience", new ArrayList<>());
        List<String> experienceKeywords = new ArrayList<>();
        List<Map<String, Object>> experience = new ArrayList<>();
        for (Map<String, Object> exp : rawExp) {
            String description = safeStr(exp.get("jobDescription"));
            experienceKeywords.addAll(extractKeywordsFromText(description));
            
            Map<String, Object> expItem = new HashMap<>();
            expItem.put("title", safeStr(exp.get("jobTitle")));
            expItem.put("company", safeStr(exp.get("organization")));
            
            String start = "";
            String end = "";
            if (exp.containsKey("dates") && exp.get("dates") instanceof Map) {
                Map dates = (Map) exp.get("dates");
                start = safeStr(dates.get("startDate"));
                end = safeStr(dates.get("endDate"));
            } else {
                start = safeStr(exp.get("startDate"));
                end = safeStr(exp.get("endDate"));
            }
            expItem.put("duration_start", start);
            expItem.put("duration_end", end);
            expItem.put("description", description);
            
            List<String> keywords = extractKeywordsFromText(description);
            expItem.put("keywords", keywords.size() > 15 ? keywords.subList(0, 15) : keywords);
            expItem.put("achievements", new ArrayList<>());
            experience.add(expItem);
        }

        List<Map<String, Object>> rawProj = (List<Map<String, Object>>) data.getOrDefault("projects", new ArrayList<>());
        List<String> projectKeywords = new ArrayList<>();
        List<Map<String, Object>> projects = new ArrayList<>();
        for (Map<String, Object> p : rawProj) {
            String description = safeStr(p.get("description"));
            projectKeywords.addAll(extractKeywordsFromText(description));
            
            Map<String, Object> pItem = new HashMap<>();
            pItem.put("name", safeStr(p.get("name") != null ? p.get("name") : p.get("title")));
            pItem.put("description", description);
            List<String> keywords = extractKeywordsFromText(description);
            pItem.put("keywords", keywords.size() > 10 ? keywords.subList(0, 10) : keywords);
            pItem.put("technologies", p.getOrDefault("technologies", new ArrayList<>()));
            pItem.put("link", safeStr(p.get("link") != null ? p.get("link") : p.get("url")));
            projects.add(pItem);
        }

        Map<String, Object> personal = new HashMap<>();
        personal.put("name", safeStr(data.get("name")));
        
        List<String> emails = (List<String>) data.get("emails");
        personal.put("email", (emails != null && !emails.isEmpty()) ? safeStr(emails.get(0)) : safeStr(data.get("email")));
        
        List<String> phones = (List<String>) data.get("phoneNumbers");
        personal.put("phone", (phones != null && !phones.isEmpty()) ? safeStr(phones.get(0)) : safeStr(data.get("phoneNumber")));
        
        String location = "";
        Object locObj = data.get("location");
        if (locObj instanceof Map) {
            Map locMap = (Map) locObj;
            location = safeStr(locMap.get("formatted"));
            if (location.isEmpty()) location = safeStr(locMap.get("rawInput"));
        } else {
            location = safeStr(locObj);
        }
        personal.put("location", location);
        
        List<Map<String, String>> links = new ArrayList<>();
        if (data.containsKey("linkedin") && !safeStr(data.get("linkedin")).isEmpty()) {
            links.add(Map.of("type", "linkedin", "url", safeStr(data.get("linkedin"))));
        }
        if (data.containsKey("github") && !safeStr(data.get("github")).isEmpty()) {
            links.add(Map.of("type", "github", "url", safeStr(data.get("github"))));
        }
        personal.put("links", links);

        List<Map<String, Object>> rawEdu = (List<Map<String, Object>>) data.getOrDefault("education", new ArrayList<>());
        List<Map<String, Object>> education = new ArrayList<>();
        for (Map<String, Object> edu : rawEdu) {
            Map<String, Object> eduItem = new HashMap<>();
            
            String degree = "";
            String field = "";
            if (edu.containsKey("accreditation") && edu.get("accreditation") instanceof Map) {
                Map acc = (Map) edu.get("accreditation");
                degree = safeStr(acc.get("education"));
                field = safeStr(acc.get("educationLevel"));
            }
            if (degree.isEmpty()) degree = safeStr(edu.get("qualification"));
            if (field.isEmpty()) field = safeStr(edu.get("fieldOfStudy"));
            
            eduItem.put("degree", degree);
            eduItem.put("field", field);
            eduItem.put("institution", safeStr(edu.get("organization")));
            
            String yearEnd = null;
            if (edu.containsKey("dates") && edu.get("dates") instanceof Map) {
                Map dates = (Map) edu.get("dates");
                String cDate = safeStr(dates.get("completionDate"));
                if (!cDate.isEmpty() && cDate.length() >= 4) yearEnd = cDate.substring(0, 4);
            }
            eduItem.put("year_end", yearEnd);
            
            String cgpa = null;
            if (edu.get("grade") instanceof Map) {
                cgpa = safeStr(((Map) edu.get("grade")).get("raw"));
            } else {
                cgpa = safeStr(edu.get("grade"));
            }
            eduItem.put("cgpa", cgpa);
            
            education.add(eduItem);
        }

        Map<String, Object> skills = new HashMap<>();
        skills.put("languages", languages);
        skills.put("frameworks", frameworks);
        skills.put("tools", tools);
        skills.put("other", other);
        
        Set<String> allSet = new HashSet<>();
        allSet.addAll(languages);
        allSet.addAll(frameworks);
        allSet.addAll(tools);
        allSet.addAll(other);
        skills.put("all", new ArrayList<>(allSet));
        
        List<String> distExpKw = experienceKeywords.stream().distinct().collect(Collectors.toList());
        skills.put("experience_keywords", distExpKw.size() > 40 ? distExpKw.subList(0, 40) : distExpKw);
        
        List<String> distProjKw = projectKeywords.stream().distinct().collect(Collectors.toList());
        skills.put("project_keywords", distProjKw.size() > 30 ? distProjKw.subList(0, 30) : distProjKw);

        Map<String, Object> normalized = new HashMap<>();
        normalized.put("personal", personal);
        normalized.put("education", education);
        normalized.put("experience", experience);
        normalized.put("skills", skills);
        normalized.put("projects", projects);

        return normalized;
    }
}
