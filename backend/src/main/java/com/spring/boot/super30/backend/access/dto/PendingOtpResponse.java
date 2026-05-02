package com.spring.boot.super30.backend.access.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PendingOtpResponse {
    private boolean hasPendingOtp;
    private String otp;
    private String doctorName;
    private String specialization;
    private String expiresAt;
}
