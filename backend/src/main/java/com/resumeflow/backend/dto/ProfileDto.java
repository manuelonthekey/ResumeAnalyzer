package com.resumeflow.backend.dto;

public class ProfileDto {
    private String id;
    private String email;
    private String name;
    private String profile_picture;
    private String preferred_roles;
    private String linkedin_url;
    private String github_url;
    private String portfolio_url;

    public ProfileDto() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getProfile_picture() { return profile_picture; }
    public void setProfile_picture(String profile_picture) { this.profile_picture = profile_picture; }
    
    public String getPreferred_roles() { return preferred_roles; }
    public void setPreferred_roles(String preferred_roles) { this.preferred_roles = preferred_roles; }
    
    public String getLinkedin_url() { return linkedin_url; }
    public void setLinkedin_url(String linkedin_url) { this.linkedin_url = linkedin_url; }
    
    public String getGithub_url() { return github_url; }
    public void setGithub_url(String github_url) { this.github_url = github_url; }
    
    public String getPortfolio_url() { return portfolio_url; }
    public void setPortfolio_url(String portfolio_url) { this.portfolio_url = portfolio_url; }
}
