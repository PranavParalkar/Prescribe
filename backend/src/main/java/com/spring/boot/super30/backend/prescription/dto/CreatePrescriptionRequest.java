package com.spring.boot.super30.backend.prescription.dto;

import com.spring.boot.super30.backend.prescription.entity.PrescriptionMedicine;
import lombok.Data;

import java.util.List;

@Data
public class CreatePrescriptionRequest {
    private String diagnosis;
    private String notes;
    private List<PrescriptionMedicine> medicines;
}
