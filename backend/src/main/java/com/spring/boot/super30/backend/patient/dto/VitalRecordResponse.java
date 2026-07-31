package com.spring.boot.super30.backend.patient.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class VitalRecordResponse {

    private UUID id;
    private Integer systolicBp;
    private Integer diastolicBp;
    private Double weightKg;
    private Integer heartRate;
    private Double bloodSugar;
    private Double temperature;
    private String notes;
    private LocalDate recordedDate;
    private LocalDateTime createdAt;
}
