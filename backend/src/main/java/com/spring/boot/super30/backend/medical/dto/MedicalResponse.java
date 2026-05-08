package com.spring.boot.super30.backend.medical.dto;

import com.spring.boot.super30.backend.shared.enums.MedicalStatus;
import lombok.Data;

import java.util.UUID;

@Data
public class MedicalResponse {
    private UUID id;
    private String medicalId;
    private String storeName;
    private String licenseNumber;
    private MedicalStatus status;
    private Double latitude;
    private Double longitude;
}
