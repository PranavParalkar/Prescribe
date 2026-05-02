package com.spring.boot.super30.backend.medical.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

@Data
public class MedicalRespondRequest {
    @NotBlank(message = "Available items description is required")
    private String availableItems;

    @NotNull(message = "Total cost is required")
    private Double totalCost;
}
