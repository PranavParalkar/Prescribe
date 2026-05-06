package com.spring.boot.super30.backend.medical.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class MedicineSearchResponse {
    private String medicineName;
    private List<StoreOption> stores;

    @Data
    @Builder
    public static class StoreOption {
        private String medicalId;
        private String storeName;
        private java.util.UUID inventoryItemId;
        private Double price;
        private Integer availableQuantity;
        private java.time.LocalDate expiryDate;
    }
}
