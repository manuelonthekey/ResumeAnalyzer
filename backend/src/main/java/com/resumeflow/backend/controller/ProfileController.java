package com.resumeflow.backend.controller;

import com.resumeflow.backend.dto.ProfileDto;
import com.resumeflow.backend.model.User;
import com.resumeflow.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/profile")
@CrossOrigin(origins = "*")
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getProfile(Authentication authentication) {
        String userEmail = authentication.getName();
        Optional<User> userOpt = userRepository.findByEmail(userEmail);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        User user = userOpt.get();
        ProfileDto dto = mapToDto(user);
        return ResponseEntity.ok(dto);
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(Authentication authentication, @RequestBody ProfileDto req) {
        String userEmail = authentication.getName();
        Optional<User> userOpt = userRepository.findByEmail(userEmail);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        User user = userOpt.get();
        if (req.getName() != null) user.setName(req.getName());
        if (req.getProfile_picture() != null) user.setProfilePicture(req.getProfile_picture());
        if (req.getPreferred_roles() != null) user.setPreferredRoles(req.getPreferred_roles());
        if (req.getLinkedin_url() != null) user.setLinkedinUrl(req.getLinkedin_url());
        if (req.getGithub_url() != null) user.setGithubUrl(req.getGithub_url());
        if (req.getPortfolio_url() != null) user.setPortfolioUrl(req.getPortfolio_url());

        userRepository.save(user);

        ProfileDto updatedDto = mapToDto(user);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Profile updated successfully");
        response.put("user", updatedDto);

        return ResponseEntity.ok(response);
    }

    private ProfileDto mapToDto(User user) {
        ProfileDto dto = new ProfileDto();
        dto.setId(user.getId().toString());
        dto.setEmail(user.getEmail());
        dto.setName(user.getName());
        dto.setProfile_picture(user.getProfilePicture());
        dto.setPreferred_roles(user.getPreferredRoles());
        dto.setLinkedin_url(user.getLinkedinUrl());
        dto.setGithub_url(user.getGithubUrl());
        dto.setPortfolio_url(user.getPortfolioUrl());
        return dto;
    }
}
