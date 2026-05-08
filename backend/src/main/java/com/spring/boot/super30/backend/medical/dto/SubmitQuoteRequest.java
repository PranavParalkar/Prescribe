package com.spring.boot.super30.backend.medical.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class SubmitQuoteRequest {
    @NotBlank(message = "Available items description is required")
    private String availableItems;

    @NotNull(message = "Total cost is required")
    private Double totalCost;
}
