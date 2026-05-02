package com.spring.boot.super30.backend.prescription.dto;

import com.spring.boot.super30.backend.prescription.entity.PrescriptionVersion;
import com.spring.boot.super30.backend.shared.enums.PrescriptionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PrescriptionResponse {
    private UUID id;
    private PrescriptionPatientInfo patient;
    private PrescriptionDoctorInfo doctor;
    private PrescriptionVersion currentVersion;
    private PrescriptionStatus status;
    private com.spring.boot.super30.backend.shared.enums.RevokeReason revokeReason;
    private LocalDateTime createdAt;
}
