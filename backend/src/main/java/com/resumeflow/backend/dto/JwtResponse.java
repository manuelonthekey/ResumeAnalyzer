package com.resumeflow.backend.dto;

import java.util.UUID;

public class JwtResponse {
    private String token;
    private UUID id;
    private String email;
    private String name;

    public JwtResponse(String token, UUID id, String email, String name) {
        this.token = token;
        this.id = id;
        this.email = email;
        this.name = name;
    }
    
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
