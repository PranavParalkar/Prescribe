package com.spring.boot.super30.backend.exception;

import java.time.Instant;

public record ApiError(
        Instant timestamp,
        int status,
        String code,
        String error,
        String message,
        String path
) {}