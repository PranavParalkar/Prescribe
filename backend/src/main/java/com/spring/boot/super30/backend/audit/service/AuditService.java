package com.spring.boot.super30.backend.audit.service;

import com.spring.boot.super30.backend.audit.entity.AuditLog;
import com.spring.boot.super30.backend.audit.repository.AuditLogRepository;
import com.spring.boot.super30.backend.shared.enums.AuditLogStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Async
    public void logAction(String userId, String action, String resourceType, String resourceId, String ipAddress, AuditLogStatus status) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .userId(userId)
                    .action(action)
                    .resourceType(resourceType)
                    .resourceId(resourceId)
                    .ipAddress(ipAddress)
                    .status(status)
                    .build();
            auditLogRepository.save(auditLog);
            log.debug("Audit log saved asynchronously for action: {}", action);
        } catch (Exception e) {
            log.error("Failed to save audit log: {}", e.getMessage(), e);
        }
    }
}
