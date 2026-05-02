package com.spring.boot.super30.backend.security.service;

import com.spring.boot.super30.backend.shared.entity.User;
import com.spring.boot.super30.backend.shared.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.debug("Loading custom user details for username: {}", username);
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> {
                    log.error("UsernameNotFoundException: User not found with email: {}", username);
                    return new UsernameNotFoundException("User not found with email: " + username);
                });

        return new CustomUserDetails(user);
    }
}
