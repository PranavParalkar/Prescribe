package com.spring.boot.super30.backend.audit.entity;

import jakarta.persistence.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.spring.boot.super30.backend.shared.enums.AuditLogStatus;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String userId; // String instead of UUID to handle email/IDs

    @Column(nullable = false)
    private String action;

    private String resourceType;

    private String resourceId; // String instead of UUID to handle string IDs

    private String ipAddress;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuditLogStatus status;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime timestamp;
    
}