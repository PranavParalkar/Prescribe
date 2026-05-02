package com.spring.boot.super30.backend.medical.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class MedicalCompleteRequest {
    @NotBlank(message = "Patient ID is required for verification")
    private String patientId;
}
