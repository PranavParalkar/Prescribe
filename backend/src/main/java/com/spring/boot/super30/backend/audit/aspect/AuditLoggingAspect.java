package com.spring.boot.super30.backend.audit.aspect;

import com.spring.boot.super30.backend.audit.annotation.Auditable;
import com.spring.boot.super30.backend.audit.service.AuditService;
import com.spring.boot.super30.backend.shared.enums.AuditLogStatus;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditLoggingAspect {

    private final AuditService auditService;

    @Around("@annotation(auditable)")
    public Object logAuditActivity(ProceedingJoinPoint joinPoint, Auditable auditable) throws Throwable {
        String userId = getCurrentUser();
        String ipAddress = getClientIp();
        String resourceId = extractResourceId(joinPoint);

        try {
            Object result = joinPoint.proceed();
            auditService.logAction(userId, auditable.action(), auditable.resourceType(), resourceId, ipAddress, AuditLogStatus.SUCCESS);
            return result;
        } catch (Exception e) {
            auditService.logAction(userId, auditable.action(), auditable.resourceType(), resourceId, ipAddress, AuditLogStatus.FAILURE);
            throw e;
        }
    }

    private String getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            return auth.getName(); // Usually email or ID from CustomUserDetails
        }
        return "SYSTEM";
    }

    private String getClientIp() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            String xfHeader = request.getHeader("X-Forwarded-For");
            if (xfHeader == null) {
                return request.getRemoteAddr();
            }
            return xfHeader.split(",")[0];
        }
        return "UNKNOWN";
    }

    private String extractResourceId(ProceedingJoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        if (args != null && args.length > 0) {
            // Very naive way: return the first arg as string if it's a UUID/String
            // For a robust system, you'd use a SpEL expression in the annotation
            return args[0] != null ? args[0].toString() : null;
        }
        return null;
    }
}
