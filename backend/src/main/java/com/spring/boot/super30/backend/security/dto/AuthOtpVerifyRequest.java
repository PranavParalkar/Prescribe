package com.spring.boot.super30.backend.security.dto;

import lombok.Data;

@Data
public class AuthOtpVerifyRequest {
    private String email;
    private String otpCode;
    private String role;
}
