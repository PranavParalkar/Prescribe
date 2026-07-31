package com.spring.boot.super30.backend.prescription.service;

import com.spring.boot.super30.backend.doctor.entity.Doctor;
import com.spring.boot.super30.backend.doctor.repository.DoctorRepository;
import com.spring.boot.super30.backend.patient.entity.Patient;
import com.spring.boot.super30.backend.patient.repository.PatientRepository;
import com.spring.boot.super30.backend.prescription.dto.CreatePrescriptionRequest;
import com.spring.boot.super30.backend.prescription.dto.PrescriptionDoctorInfo;
import com.spring.boot.super30.backend.prescription.dto.PrescriptionPatientInfo;
import com.spring.boot.super30.backend.prescription.dto.PrescriptionResponse;
import com.spring.boot.super30.backend.prescription.entity.Prescription;
import com.spring.boot.super30.backend.prescription.entity.PrescriptionMedicine;
import com.spring.boot.super30.backend.prescription.entity.PrescriptionVersion;
import com.spring.boot.super30.backend.prescription.repository.PrescriptionRepository;
import com.spring.boot.super30.backend.prescription.repository.PrescriptionVersionRepository;
import com.spring.boot.super30.backend.shared.enums.PrescriptionStatus;
import com.spring.boot.super30.backend.exception.custom.BadRequestException;
import com.spring.boot.super30.backend.exception.custom.ResourceNotFoundException;
import com.spring.boot.super30.backend.subscription.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
public class PrescriptionService {

        private final PrescriptionRepository prescriptionRepository;
        private final PrescriptionVersionRepository prescriptionVersionRepository;
        private final PatientRepository patientRepository;
        private final DoctorRepository doctorRepository;
        private final SubscriptionService subscriptionService;

        public PrescriptionService(
                PrescriptionRepository prescriptionRepository,
                PrescriptionVersionRepository prescriptionVersionRepository,
                PatientRepository patientRepository,
                DoctorRepository doctorRepository,
                @Lazy SubscriptionService subscriptionService) {
                this.prescriptionRepository = prescriptionRepository;
                this.prescriptionVersionRepository = prescriptionVersionRepository;
                this.patientRepository = patientRepository;
                this.doctorRepository = doctorRepository;
                this.subscriptionService = subscriptionService;
        }

        public PrescriptionResponse createPrescription(
                        String patientId,
                        String doctorId,
                        CreatePrescriptionRequest request) {
                log.info("Creating new prescription for patient: {}, doctor: {}", patientId, doctorId);

                // Enforce prescription limit based on subscription tier
                if (!subscriptionService.canCreatePrescription(patientId)) {
                        int limit = subscriptionService.getPrescriptionLimit(patientId);
                        log.warn("Prescription limit ({}) reached for patient: {}", limit, patientId);
                        throw new BadRequestException(
                                "Prescription limit reached. Maximum " + limit + " prescriptions allowed for your plan.",
                                "PRESCRIPTION_LIMIT_REACHED");
                }

                Patient patient = patientRepository.findByPatientId(patientId)
                                .orElseThrow(() -> {
                                        log.error("Patient not found with ID: {}", patientId);
                                        return new ResourceNotFoundException("Patient not found", "PATIENT_NOT_FOUND");
                                });

                Doctor doctor = doctorRepository.findByDoctorId(doctorId)
                                .orElseThrow(() -> {
                                        log.error("Doctor not found with ID: {}", doctorId);
                                        return new ResourceNotFoundException("Doctor not found", "DOCTOR_NOT_FOUND");
                                });

                if (doctor.getStatus() != com.spring.boot.super30.backend.shared.enums.DoctorStatus.VERIFIED) {
                        log.warn("Doctor {} is not verified. Status: {}", doctorId, doctor.getStatus());
                        throw new BadRequestException("Only verified doctors can assign prescriptions", "DOCTOR_NOT_VERIFIED");
                }

                Prescription prescription = new Prescription();
                prescription.setPatient(patient);
                prescription.setDoctor(doctor);
                prescription.setStatus(PrescriptionStatus.ACTIVE);

                // Persist the prescription first to avoid transient reference issues when
                // setting `currentVersion` (which writes a FK from prescriptions -> versions).
                Prescription savedPrescription = prescriptionRepository.save(prescription);

                PrescriptionVersion version = new PrescriptionVersion();
                version.setPrescription(savedPrescription);
                version.setVersionNumber(1);
                version.setDiagnosis(request.getDiagnosis());
                version.setNotes(request.getNotes());

                java.util.List<PrescriptionMedicine> medicines = request.getMedicines();
                if (medicines != null) {
                    medicines.forEach(m -> m.setPrescriptionVersion(version));
                    version.setMedicines(medicines);
                }

                PrescriptionVersion savedVersion = prescriptionVersionRepository.save(version);

                savedPrescription.setCurrentVersion(savedVersion);

                log.debug("Saving active prescription to database");
                Prescription saved = prescriptionRepository.save(savedPrescription);
                log.info("Successfully created prescription with ID: {}", saved.getId());
                return convertToResponse(saved);
        }

        public PrescriptionResponse updatePrescription(UUID id, CreatePrescriptionRequest request) {
                log.info("Updating prescription with ID: {}", id);
                Prescription prescription = prescriptionRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found", "PRESCRIPTION_NOT_FOUND"));

                if (prescription.getStatus() == PrescriptionStatus.REVOKED) {
                        throw new BadRequestException("Cannot update a revoked prescription", "PRESCRIPTION_REVOKED");
                }

                int newVersionNumber = prescription.getCurrentVersion().getVersionNumber() + 1;

                PrescriptionVersion version = new PrescriptionVersion();
                version.setPrescription(prescription);
                version.setVersionNumber(newVersionNumber);
                version.setDiagnosis(request.getDiagnosis());
                version.setNotes(request.getNotes());

                java.util.List<PrescriptionMedicine> medicines = request.getMedicines();
                if (medicines != null) {
                    medicines.forEach(m -> m.setPrescriptionVersion(version));
                    version.setMedicines(medicines);
                }

                PrescriptionVersion savedVersion = prescriptionVersionRepository.save(version);
                prescription.setCurrentVersion(savedVersion);
                
                log.debug("Saving updated prescription version to database");
                Prescription saved = prescriptionRepository.save(prescription);
                log.info("Successfully updated prescription ID: {} to version {}", id, newVersionNumber);
                return convertToResponse(saved);
        }

        public PrescriptionResponse revokePrescription(UUID id, com.spring.boot.super30.backend.shared.enums.RevokeReason reason) {

                log.info("Attempting to revoke prescription with ID: {} for reason: {}", id, reason);
                Prescription prescription = prescriptionRepository.findById(id)
                                .orElseThrow(() -> {
                                        log.error("Failed to revoke. Prescription not found with ID: {}", id);
                                        return new ResourceNotFoundException("Prescription not found", "PRESCRIPTION_NOT_FOUND");
                                });

                if (reason == null) {
                        throw new BadRequestException("Revoke reason is required", "REVOKE_REASON_REQUIRED");
                }

                prescription.setStatus(PrescriptionStatus.REVOKED);
                prescription.setRevokeReason(reason);

                log.debug("Saving revoked prescription status to database");
                Prescription saved = prescriptionRepository.save(prescription);
                log.info("Successfully revoked prescription with ID: {}", id);
                return convertToResponse(saved);
        }

        public List<PrescriptionResponse> getPatientPrescriptions(String patientId) {
            Patient patient = patientRepository.findByPatientId(patientId)
                    .orElseThrow(() -> new ResourceNotFoundException("Patient not found", "PATIENT_NOT_FOUND"));
            return prescriptionRepository.findByPatient(patient).stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());
        }

        public List<PrescriptionResponse> getDoctorPrescriptions(String doctorId) {
            Doctor doctor = doctorRepository.findByDoctorId(doctorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor not found", "DOCTOR_NOT_FOUND"));
            return prescriptionRepository.findByDoctor(doctor).stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());
        }

        public PrescriptionResponse getPrescriptionById(UUID id) {
            Prescription prescription = prescriptionRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Prescription not found", "PRESCRIPTION_NOT_FOUND"));
            return convertToResponse(prescription);
        }

        private PrescriptionResponse convertToResponse(Prescription rx) {
            PrescriptionPatientInfo patientInfo = PrescriptionPatientInfo.builder()
                    .patientId(rx.getPatient().getPatientId())
                    .firstName(rx.getPatient().getUser().getFirstName())
                    .lastName(rx.getPatient().getUser().getLastName())
                    .email(rx.getPatient().getUser().getEmail())
                    .build();

            PrescriptionDoctorInfo doctorInfo;
            if (rx.getDoctor() != null) {
                doctorInfo = PrescriptionDoctorInfo.builder()
                        .doctorId(rx.getDoctor().getDoctorId())
                        .firstName(rx.getDoctor().getUser().getFirstName())
                        .lastName(rx.getDoctor().getUser().getLastName())
                        .specialization(rx.getDoctor().getSpecialization())
                        .email(rx.getDoctor().getUser().getEmail())
                        .build();
            } else if (rx.getDeletedDoctor() != null) {
                doctorInfo = PrescriptionDoctorInfo.builder()
                        .doctorId(rx.getDeletedDoctor().getDoctorId())
                        .firstName(rx.getDeletedDoctor().getFirstName())
                        .lastName(rx.getDeletedDoctor().getLastName())
                        .specialization(rx.getDeletedDoctor().getSpecialization())
                        .email(rx.getDeletedDoctor().getEmail())
                        .build();
            } else {
                doctorInfo = PrescriptionDoctorInfo.builder().build();
            }

            return PrescriptionResponse.builder()
                    .id(rx.getId())
                    .patient(patientInfo)
                    .doctor(doctorInfo)
                    .currentVersion(rx.getCurrentVersion())
                    .status(rx.getStatus())
                    .revokeReason(rx.getRevokeReason())
                    .createdAt(rx.getCreatedAt())
                    .build();
        }

        // ─── Analytics ──────────────────────────────────────────────────────────

        public com.spring.boot.super30.backend.prescription.dto.PatientAnalyticsResponse getPatientAnalytics(String patientId) {
            Patient patient = patientRepository.findByPatientId(patientId)
                    .orElseThrow(() -> new ResourceNotFoundException("Patient not found", "PATIENT_NOT_FOUND"));

            List<Prescription> prescriptions = prescriptionRepository.findByPatient(patient);

            long active = prescriptions.stream()
                    .filter(p -> p.getStatus() == PrescriptionStatus.ACTIVE)
                    .count();

            // Unique doctors
            java.util.Set<String> doctorIds = new java.util.HashSet<>();
            prescriptions.forEach(rx -> {
                if (rx.getDoctor() != null) doctorIds.add(rx.getDoctor().getDoctorId());
                else if (rx.getDeletedDoctor() != null) doctorIds.add(rx.getDeletedDoctor().getDoctorId());
            });

            // Timeline
            List<com.spring.boot.super30.backend.prescription.dto.PatientAnalyticsResponse.PrescriptionTimelineEntry> timeline =
                    prescriptions.stream()
                            .sorted(java.util.Comparator.comparing(Prescription::getCreatedAt, java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())))
                            .map(rx -> {
                                PrescriptionVersion v = rx.getCurrentVersion();
                                String doctorName = "Unknown";
                                if (rx.getDoctor() != null) {
                                    doctorName = "Dr. " + (rx.getDoctor().getUser().getFirstName() != null ? rx.getDoctor().getUser().getFirstName() : "") +
                                            " " + (rx.getDoctor().getUser().getLastName() != null ? rx.getDoctor().getUser().getLastName() : "");
                                } else if (rx.getDeletedDoctor() != null) {
                                    doctorName = "Dr. " + (rx.getDeletedDoctor().getFirstName() != null ? rx.getDeletedDoctor().getFirstName() : "") +
                                            " " + (rx.getDeletedDoctor().getLastName() != null ? rx.getDeletedDoctor().getLastName() : "");
                                }
                                return com.spring.boot.super30.backend.prescription.dto.PatientAnalyticsResponse.PrescriptionTimelineEntry.builder()
                                        .date(rx.getCreatedAt() != null ? rx.getCreatedAt().toLocalDate().toString() : "")
                                        .diagnosis(v != null ? v.getDiagnosis() : "")
                                        .medicineCount(v != null && v.getMedicines() != null ? v.getMedicines().size() : 0)
                                        .doctorName(doctorName.trim())
                                        .status(rx.getStatus().name())
                                        .build();
                            })
                            .collect(Collectors.toList());

            // Medicine frequency
            java.util.Map<String, Long> medCounts = new java.util.LinkedHashMap<>();
            prescriptions.forEach(rx -> {
                PrescriptionVersion v = rx.getCurrentVersion();
                if (v != null && v.getMedicines() != null) {
                    v.getMedicines().forEach(m -> {
                        String name = m.getMedicineName();
                        if (name != null && !name.isBlank()) {
                            medCounts.merge(name, 1L, Long::sum);
                        }
                    });
                }
            });
            List<com.spring.boot.super30.backend.prescription.dto.PatientAnalyticsResponse.MedicineFrequencyEntry> medicineFrequency =
                    medCounts.entrySet().stream()
                            .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                            .limit(10)
                            .map(e -> com.spring.boot.super30.backend.prescription.dto.PatientAnalyticsResponse.MedicineFrequencyEntry.builder()
                                    .medicineName(e.getKey())
                                    .count(e.getValue())
                                    .build())
                            .collect(Collectors.toList());

            // Doctor distribution
            java.util.Map<String, long[]> doctorStats = new java.util.LinkedHashMap<>(); // key -> [count]
            java.util.Map<String, String> doctorSpecialties = new java.util.LinkedHashMap<>();
            prescriptions.forEach(rx -> {
                String doctorName = "Unknown";
                String specialty = "";
                if (rx.getDoctor() != null) {
                    doctorName = "Dr. " + (rx.getDoctor().getUser().getFirstName() != null ? rx.getDoctor().getUser().getFirstName() : "") +
                            " " + (rx.getDoctor().getUser().getLastName() != null ? rx.getDoctor().getUser().getLastName() : "");
                    specialty = rx.getDoctor().getSpecialization() != null ? rx.getDoctor().getSpecialization() : "";
                } else if (rx.getDeletedDoctor() != null) {
                    doctorName = "Dr. " + (rx.getDeletedDoctor().getFirstName() != null ? rx.getDeletedDoctor().getFirstName() : "") +
                            " " + (rx.getDeletedDoctor().getLastName() != null ? rx.getDeletedDoctor().getLastName() : "");
                    specialty = rx.getDeletedDoctor().getSpecialization() != null ? rx.getDeletedDoctor().getSpecialization() : "";
                }
                doctorName = doctorName.trim();
                doctorStats.computeIfAbsent(doctorName, k -> new long[]{0});
                doctorStats.get(doctorName)[0]++;
                doctorSpecialties.putIfAbsent(doctorName, specialty);
            });

            List<com.spring.boot.super30.backend.prescription.dto.PatientAnalyticsResponse.DoctorDistributionEntry> doctorDistribution =
                    doctorStats.entrySet().stream()
                            .sorted((a, b) -> Long.compare(b.getValue()[0], a.getValue()[0]))
                            .map(e -> com.spring.boot.super30.backend.prescription.dto.PatientAnalyticsResponse.DoctorDistributionEntry.builder()
                                    .doctorName(e.getKey())
                                    .specialty(doctorSpecialties.getOrDefault(e.getKey(), ""))
                                    .prescriptionCount(e.getValue()[0])
                                    .build())
                            .collect(Collectors.toList());

            return com.spring.boot.super30.backend.prescription.dto.PatientAnalyticsResponse.builder()
                    .totalPrescriptions(prescriptions.size())
                    .activePrescriptions(active)
                    .uniqueDoctors(doctorIds.size())
                    .prescriptionTimeline(timeline)
                    .medicineFrequency(medicineFrequency)
                    .doctorDistribution(doctorDistribution)
                    .build();
        }

}
