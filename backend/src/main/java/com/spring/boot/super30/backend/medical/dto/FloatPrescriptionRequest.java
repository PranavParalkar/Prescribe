package com.spring.boot.super30.backend.medical.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

@Data
public class FloatPrescriptionRequest {
    private UUID prescriptionId;

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;

    private String medicineList;
}
