package com.spring.boot.super30.backend.security.service;

import com.spring.boot.super30.backend.shared.entity.User;
import com.spring.boot.super30.backend.shared.enums.UserRole;
import com.spring.boot.super30.backend.shared.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        log.debug("Loading OAuth2 user details");

        String email = oAuth2User.getAttribute("email");
        if (email == null) {
            throw new OAuth2AuthenticationException("Email not found from OAuth2 provider");
        }

        Optional<User> userOptional = userRepository.findByEmail(email);
        User user;
        
        String givenName = oAuth2User.getAttribute("given_name");
        String familyName = oAuth2User.getAttribute("family_name");
        // Fallback to "name" attribute if specific ones not available
        if (givenName == null && oAuth2User.getAttribute("name") != null) {
            String fullName = oAuth2User.getAttribute("name");
            String[] parts = fullName.split(" ", 2);
            givenName = parts[0];
            if (parts.length > 1) familyName = parts[1];
        }

        if (userOptional.isPresent()) {
            user = userOptional.get();
            // Optionally update existing users' names if missing
            boolean updated = false;
            if (user.getFirstName() == null && givenName != null) { user.setFirstName(givenName); updated = true; }
            if (user.getLastName() == null && familyName != null) { user.setLastName(familyName); updated = true; }
            if (updated) { user = userRepository.save(user); }
        } else {
            user = new User();
            user.setEmail(email);
            // Map the names we extracted
            user.setFirstName(givenName);
            user.setLastName(familyName);
            
            // using a default role for newly registered OAuth users
            user.setRole(UserRole.PATIENT);
            user.setIsActive(true);
            user.setCreatedAt(LocalDateTime.now());
            user = userRepository.save(user);
            log.info("Created new user via OAuth2: {}", email);
        }

        return new CustomUserDetails(user, oAuth2User.getAttributes());
    }
}
