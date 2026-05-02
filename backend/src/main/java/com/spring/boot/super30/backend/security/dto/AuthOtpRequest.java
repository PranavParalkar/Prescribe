package com.spring.boot.super30.backend.security.dto;

import lombok.Data;

@Data
public class AuthOtpRequest {
    private String email;
    private Boolean isLogin;
}
