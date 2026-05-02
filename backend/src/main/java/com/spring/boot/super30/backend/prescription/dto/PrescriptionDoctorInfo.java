package com.spring.boot.super30.backend.prescription.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PrescriptionDoctorInfo {
    private String doctorId;
    private String firstName;
    private String lastName;
    private String specialization;
    private String email;
}
