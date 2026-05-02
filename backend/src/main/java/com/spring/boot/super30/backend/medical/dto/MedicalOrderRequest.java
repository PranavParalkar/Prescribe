package com.spring.boot.super30.backend.medical.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

@Data
public class MedicalOrderRequest {
    @NotNull(message = "Prescription ID is required")
    private UUID prescriptionId;

    @NotNull(message = "Medical ID is required")
    private UUID medicalId;
}
