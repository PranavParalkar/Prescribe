package com.spring.boot.super30.backend.subscription.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class VerifyPaymentRequest {
    private String patientId;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;
}
