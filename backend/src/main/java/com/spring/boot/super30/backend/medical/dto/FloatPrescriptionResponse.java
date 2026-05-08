package com.spring.boot.super30.backend.medical.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class FloatPrescriptionResponse {
    private UUID id;
    private UUID prescriptionId;
    private UUID patientId;
    private String patientName;
    private String medicineList;
    private String status;
    private Double latitude;
    private Double longitude;
    private Double radiusKm;
    private LocalDateTime createdAt;
    private List<FloatQuoteResponse> quotes;

    @Data
    @Builder
    public static class FloatQuoteResponse {
        private UUID quoteId;
        private UUID medicalId;
        private String medicalIdString;
        private String storeName;
        private String availableItems;
        private Double totalCost;
        private LocalDateTime createdAt;
    }
}
