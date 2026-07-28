package com.spring.boot.super30.backend.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OcrStructuredResponse {

    private String rawText;
    private StructuredData structuredData;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class StructuredData {
        private DoctorInfo doctor;
        private PatientInfo patient;
        private String prescriptionDate;
        private String diagnosis;
        private List<Medication> medications;
        private List<String> labTests;
        private String followUp;
        private String notes;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DoctorInfo {
        private String name;
        private String qualifications;
        private String hospital;
        private String contact;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PatientInfo {
        private String name;
        private String age;
        private String gender;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Medication {
        private String name;
        private String dosage;
        private String frequency;
        private String duration;
        private String instructions;
    }
}
