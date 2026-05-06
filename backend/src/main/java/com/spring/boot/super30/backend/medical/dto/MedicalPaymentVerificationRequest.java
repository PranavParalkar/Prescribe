package com.spring.boot.super30.backend.medical.dto;

import lombok.Data;

@Data
public class MedicalPaymentVerificationRequest {
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;
}
