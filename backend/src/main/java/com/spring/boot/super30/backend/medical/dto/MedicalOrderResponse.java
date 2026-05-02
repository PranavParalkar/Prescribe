package com.spring.boot.super30.backend.medical.dto;

import com.spring.boot.super30.backend.shared.enums.MedicalOrderStatus;
import lombok.Data;

import java.util.UUID;
import java.time.LocalDateTime;

@Data
public class MedicalOrderResponse {
    private UUID id;
    private UUID prescriptionId;
    private UUID patientId;
    private UUID medicalId;
    private String storeName;
    private String medicalIdString;
    private MedicalOrderStatus status;
    private String availableItems;
    private Double totalCost;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
