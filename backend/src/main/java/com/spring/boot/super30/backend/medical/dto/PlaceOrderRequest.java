package com.spring.boot.super30.backend.medical.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;

import java.util.List;
import java.util.UUID;

@Data
public class PlaceOrderRequest {
    @NotBlank(message = "Medical store ID is required")
    private String medicalId;

    private UUID prescriptionId;

    @NotNull(message = "Items are required")
    private List<OrderItemEntry> items;

    @Data
    public static class OrderItemEntry {
        @NotNull(message = "Inventory item ID is required")
        private UUID inventoryItemId;

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        private Integer quantity;
    }
}
