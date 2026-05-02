package com.spring.boot.super30.backend.exception;

import com.spring.boot.super30.backend.exception.custom.BadRequestException;
import com.spring.boot.super30.backend.exception.custom.ConflictException;
import com.spring.boot.super30.backend.exception.custom.ResourceNotFoundException;
import com.spring.boot.super30.backend.exception.custom.UnauthorizedException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        log.warn("Resource Not Found at {}: {}", request.getRequestURI(), ex.getMessage());
        return buildError(ex.getCode(), ex.getMessage(), HttpStatus.NOT_FOUND, request);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiError> handleBadRequest(BadRequestException ex, HttpServletRequest request) {
        log.warn("Bad Request at {}: {}", request.getRequestURI(), ex.getMessage());
        return buildError(ex.getCode(), ex.getMessage(), HttpStatus.BAD_REQUEST, request);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiError> handleUnauthorized(UnauthorizedException ex, HttpServletRequest request) {
        log.warn("Unauthorized at {}: {}", request.getRequestURI(), ex.getMessage());
        return buildError(ex.getCode(), ex.getMessage(), HttpStatus.UNAUTHORIZED, request);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiError> handleConflict(ConflictException ex, HttpServletRequest request) {
        log.warn("Conflict at {}: {}", request.getRequestURI(), ex.getMessage());
        return buildError(ex.getCode(), ex.getMessage(), HttpStatus.CONFLICT, request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidationExceptions(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .findFirst()
                .orElse(ex.getMessage());

        log.warn("Validation Error at {}: {}", request.getRequestURI(), message);
        return buildError("VALIDATION_ERROR", message, HttpStatus.BAD_REQUEST, request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        log.warn("Access Denied at {}: {}", request.getRequestURI(), ex.getMessage());
        return buildError("FORBIDDEN", "Access denied", HttpStatus.FORBIDDEN, request);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentials(BadCredentialsException ex, HttpServletRequest request) {
        log.warn("Bad credentials at {}: {}", request.getRequestURI(), ex.getMessage());
        return buildError("BAD_CREDENTIALS", "Invalid email or password", HttpStatus.UNAUTHORIZED, request);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthentication(AuthenticationException ex, HttpServletRequest request) {
        log.warn("Authentication error at {}: {}", request.getRequestURI(), ex.getMessage());
        return buildError("UNAUTHORIZED", "Unauthorized", HttpStatus.UNAUTHORIZED, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneric(Exception ex, HttpServletRequest request) {
        log.error("Unhandled logical exception occurred at {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return buildError("INTERNAL_SERVER_ERROR", "Internal server error", HttpStatus.INTERNAL_SERVER_ERROR, request);
    }

    private ResponseEntity<ApiError> buildError(String code, String message, HttpStatus status, HttpServletRequest request) {
        ApiError error = new ApiError(
                Instant.now(),
                status.value(),
                code,
                status.getReasonPhrase(),
                message,
                request.getRequestURI()
        );
        return new ResponseEntity<>(error, status);
    }
}