package com.spring.boot.super30.backend.audit.repository;

import com.spring.boot.super30.backend.audit.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
}
