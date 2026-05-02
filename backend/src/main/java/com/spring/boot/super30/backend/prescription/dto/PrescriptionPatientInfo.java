package com.spring.boot.super30.backend.prescription.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PrescriptionPatientInfo {
    private String patientId;
    private String firstName;
    private String lastName;
    private String email;
}
