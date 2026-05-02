package com.spring.boot.super30.backend.security.controller;

import com.spring.boot.super30.backend.security.dto.AuthRequest;
import com.spring.boot.super30.backend.security.dto.AuthResponse;
import com.spring.boot.super30.backend.security.dto.RegisterRequest;
import com.spring.boot.super30.backend.security.jwt.JwtService;
import com.spring.boot.super30.backend.security.service.CustomUserDetails;
import com.spring.boot.super30.backend.shared.entity.User;
import com.spring.boot.super30.backend.shared.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;
import com.spring.boot.super30.backend.security.dto.AuthOtpRequest;
import com.spring.boot.super30.backend.security.dto.AuthOtpVerifyRequest;
import com.spring.boot.super30.backend.security.service.EmailService;
import com.spring.boot.super30.backend.shared.entity.AuthOtp;
import com.spring.boot.super30.backend.shared.repository.AuthOtpRepository;
import com.spring.boot.super30.backend.shared.utils.PIIMasker;
import java.time.LocalDateTime;
import java.util.Random;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final AuthOtpRepository authOtpRepository;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        log.info("Attempting to register new user with email: {}", PIIMasker.maskEmail(request.getEmail()));
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            log.warn("Registration failed: User with email {} already exists.", PIIMasker.maskEmail(request.getEmail()));
            return ResponseEntity.badRequest().build();
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole() != null ? request.getRole()
                : com.spring.boot.super30.backend.shared.enums.UserRole.PATIENT);
        user.setIsActive(true);

        userRepository.save(user);

        var jwtToken = jwtService.generateToken(new CustomUserDetails(user));
        log.info("Successfully registered user with email: {}", PIIMasker.maskEmail(request.getEmail()));
        return ResponseEntity.ok(AuthResponse.builder().token(jwtToken).build());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        log.info("Authentication attempt for email: {}", PIIMasker.maskEmail(request.getEmail()));
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();

        var jwtToken = jwtService.generateToken(new CustomUserDetails(user));
        log.info("Successfully authenticated user: {}", PIIMasker.maskEmail(request.getEmail()));
        return ResponseEntity.ok(AuthResponse.builder().token(jwtToken).build());
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody AuthOtpRequest request) {
        log.info("Requesting OTP for email: {}", PIIMasker.maskEmail(request.getEmail()));
        String email = request.getEmail();
        
        if (Boolean.TRUE.equals(request.getIsLogin())) {
            if (userRepository.findByEmail(email).isEmpty()) {
                log.warn("Account not found for email: {}", PIIMasker.maskEmail(email));
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Account not found. Please sign up first."));
            }
        }

        String otp = String.format("%06d", new Random().nextInt(999999));
        
        AuthOtp authOtp = new AuthOtp();
        authOtp.setEmail(email);
        authOtp.setOtpCode(otp);
        authOtp.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        authOtpRepository.save(authOtp);

        emailService.sendOtpEmail(email, otp);

        return ResponseEntity.ok().body(java.util.Map.of("message", "OTP sent successfully"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<AuthResponse> verifyOtp(@RequestBody AuthOtpVerifyRequest request) {
        log.info("Verifying OTP for email: {}", PIIMasker.maskEmail(request.getEmail()));
        String email = request.getEmail();
        String otpCode = request.getOtpCode();

        Optional<AuthOtp> optionalOtp = authOtpRepository.findFirstByEmailAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(email, LocalDateTime.now());

        if (optionalOtp.isEmpty() || !optionalOtp.get().getOtpCode().equals(otpCode)) {
            log.warn("Invalid or expired OTP for email: {}", PIIMasker.maskEmail(email));
            return ResponseEntity.badRequest().build();
        }

        AuthOtp authOtp = optionalOtp.get();
        authOtp.setUsed(true);
        authOtpRepository.save(authOtp);

        Optional<User> optionalUser = userRepository.findByEmail(email);
        User user;
        if (optionalUser.isEmpty()) {
            // New user registration flow via OTP
            user = new User();
            user.setEmail(email);
            com.spring.boot.super30.backend.shared.enums.UserRole userRole = com.spring.boot.super30.backend.shared.enums.UserRole.PATIENT;
            if (request.getRole() != null && request.getRole().equalsIgnoreCase("doctor")) {
                userRole = com.spring.boot.super30.backend.shared.enums.UserRole.DOCTOR;
            } else if (request.getRole() != null && request.getRole().equalsIgnoreCase("admin")) {
                userRole = com.spring.boot.super30.backend.shared.enums.UserRole.ADMIN;
            } else if (request.getRole() != null && request.getRole().equalsIgnoreCase("medical")) {
                userRole = com.spring.boot.super30.backend.shared.enums.UserRole.MEDICAL;
            }
            user.setRole(userRole); 
            user.setPasswordHash(passwordEncoder.encode(java.util.UUID.randomUUID().toString())); // dummy password
            user.setIsActive(true);
            userRepository.save(user);
        } else {
            user = optionalUser.get();
        }

        if ("prescribe.services@gmail.com".equalsIgnoreCase(email.trim()) || "prescribe.service@gmail.com".equalsIgnoreCase(email.trim())) {
            user.setRole(com.spring.boot.super30.backend.shared.enums.UserRole.ADMIN);
            userRepository.save(user);
        }

        var jwtToken = jwtService.generateToken(new CustomUserDetails(user));
        log.info("Successfully authenticated user via OTP: {}", PIIMasker.maskEmail(email));
        return ResponseEntity.ok(AuthResponse.builder().token(jwtToken).build());
    }
}
