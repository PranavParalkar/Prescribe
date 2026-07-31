package com.spring.boot.super30.backend.patient.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class VitalRecordRequest {

    private Integer systolicBp;
    private Integer diastolicBp;
    private Double weightKg;
    private Integer heartRate;
    private Double bloodSugar;
    private Double temperature;
    private String notes;

    @NotNull(message = "Recorded date is required")
    private LocalDate recordedDate;
}
