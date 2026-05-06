package com.spring.boot.super30.backend.medical.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class InventoryItemResponse {
    private UUID id;
    private String medicineName;
    private String genericName;
    private String manufacturer;
    private String batchNumber;
    private Integer quantity;
    private Double price;
    private LocalDate expiryDate;
    private String category;
    private Integer lowStockThreshold;
    private Boolean active;
    private Boolean lowStock;
    private Boolean expiringSoon;
    private Boolean expired;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
