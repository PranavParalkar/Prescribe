package com.spring.boot.super30.backend.medical.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class MedicalRegistrationRequest {
    @NotBlank(message = "Store name is required")
    private String storeName;

    @NotBlank(message = "License number is required")
    private String licenseNumber;

    private Double latitude;
    private Double longitude;
}
