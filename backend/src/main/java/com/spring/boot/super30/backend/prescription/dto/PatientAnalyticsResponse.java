package com.spring.boot.super30.backend.prescription.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PatientAnalyticsResponse {

    private long totalPrescriptions;
    private long activePrescriptions;
    private long uniqueDoctors;

    private List<PrescriptionTimelineEntry> prescriptionTimeline;
    private List<MedicineFrequencyEntry> medicineFrequency;
    private List<DoctorDistributionEntry> doctorDistribution;

    @Data
    @Builder
    public static class PrescriptionTimelineEntry {
        private String date;
        private String diagnosis;
        private int medicineCount;
        private String doctorName;
        private String status;
    }

    @Data
    @Builder
    public static class MedicineFrequencyEntry {
        private String medicineName;
        private long count;
    }

    @Data
    @Builder
    public static class DoctorDistributionEntry {
        private String doctorName;
        private String specialty;
        private long prescriptionCount;
    }
}
