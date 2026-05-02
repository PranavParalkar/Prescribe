package com.spring.boot.super30.backend.shared.repository;

import com.spring.boot.super30.backend.shared.entity.AuthOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.List;

@Repository
public interface AuthOtpRepository extends JpaRepository<AuthOtp, UUID> {
    
    Optional<AuthOtp> findFirstByEmailAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(String email, LocalDateTime now);
    
    List<AuthOtp> findByEmail(String email);
}
