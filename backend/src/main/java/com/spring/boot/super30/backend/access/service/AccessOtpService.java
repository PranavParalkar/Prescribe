package com.spring.boot.super30.backend.access.service;

import com.spring.boot.super30.backend.access.dto.OtpRequestResponse;
import com.spring.boot.super30.backend.access.dto.OtpVerifyResponse;
import com.spring.boot.super30.backend.access.dto.PendingOtpResponse;
import com.spring.boot.super30.backend.access.entity.AccessOtp;
import com.spring.boot.super30.backend.access.repository.AccessOtpRepository;
import com.spring.boot.super30.backend.access.util.SpecializationMapper;
import com.spring.boot.super30.backend.doctor.entity.Doctor;
import com.spring.boot.super30.backend.doctor.repository.DoctorRepository;
import com.spring.boot.super30.backend.document.dto.PatientDocumentResponse;
import com.spring.boot.super30.backend.document.service.PatientDocumentService;
import com.spring.boot.super30.backend.exception.custom.BadRequestException;
import com.spring.boot.super30.backend.exception.custom.ResourceNotFoundException;
import com.spring.boot.super30.backend.patient.entity.Patient;
import com.spring.boot.super30.backend.patient.repository.PatientRepository;
import com.spring.boot.super30.backend.security.service.EmailService;
import com.spring.boot.super30.backend.shared.enums.MedicalCategory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccessOtpService {

    private final AccessOtpRepository otpRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final PatientDocumentService documentService;
    private final EmailService emailService;

    private static final int OTP_EXPIRY_MINUTES = 2;
    private static final SecureRandom RANDOM = new SecureRandom();

    // ─── Request OTP ─────────────────────────────────────────────────────────

    @Transactional
    public OtpRequestResponse requestOtp(String doctorId, String patientId) {
        Doctor doctor = doctorRepository.findByDoctorId(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found", "DOCTOR_NOT_FOUND"));

        Patient patient = patientRepository.findByPatientId(patientId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Patient not found. Please verify the Patient ID.", "PATIENT_NOT_FOUND"));

        // Invalidate any existing unused OTPs for this doctor-patient pair
        List<AccessOtp> existingOtps = otpRepository.findByDoctorAndPatientAndUsedFalse(doctor, patient);
        for (AccessOtp existing : existingOtps) {
            existing.setUsed(true);
        }
        otpRepository.saveAll(existingOtps);

        // Generate new 6-digit OTP
        String otpCode = String.format("%06d", RANDOM.nextInt(1_000_000));
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES);

        AccessOtp otp = new AccessOtp();
        otp.setDoctor(doctor);
        otp.setPatient(patient);
        otp.setOtpCode(otpCode);
        otp.setExpiresAt(expiresAt);
        otp.setUsed(false);

        otpRepository.save(otp);

        log.info("OTP generated for doctor {} requesting access to patient {}. Expires at {}",
                doctorId, patientId, expiresAt);

        // Send OTP via email
        if (patient.getUser() != null && patient.getUser().getEmail() != null) {
            String docName = "A doctor";
            if (doctor.getUser() != null) {
                String fn = doctor.getUser().getFirstName() != null ? doctor.getUser().getFirstName() : "";
                String ln = doctor.getUser().getLastName() != null ? doctor.getUser().getLastName() : "";
                docName = ("Dr. " + fn + " " + ln).trim();
            }

            String text = String.format("Hello,\n\n%s is requesting access to your medical records.\n" +
                    "Your OTP code is: %s\n\nThis code will expire in %d minutes.\n\n" +
                    "If you did not authorize this, please ignore this email.\n\nThank you,\nPrescribe Team",
                    docName, otpCode, OTP_EXPIRY_MINUTES);
            
            try {
                emailService.sendAccessOtpEmail(patient.getUser().getEmail(), docName, otpCode, OTP_EXPIRY_MINUTES);
                log.info("Sent access OTP email to {}", patient.getUser().getEmail());
            } catch (Exception e) {
                log.error("Failed to send access OTP email to {}", patient.getUser().getEmail(), e);
            }
        }

        return OtpRequestResponse.builder()
                .message("OTP has been sent to the patient's registered email address.")
                .expiresAt(expiresAt.toString())
                .build();
    }

    // ─── Get Pending OTP (Patient side) ──────────────────────────────────────

    public PendingOtpResponse getPendingOtp(String patientId) {
        Patient patient = patientRepository.findByPatientId(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found", "PATIENT_NOT_FOUND"));

        return otpRepository
                .findFirstByPatientAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                        patient, LocalDateTime.now())
                .map(otp -> {
                    Doctor doctor = otp.getDoctor();
                    String doctorName = "Unknown Doctor";
                    String specialization = "";
                    if (doctor.getUser() != null) {
                        doctorName = "Dr. " +
                                (doctor.getUser().getFirstName() != null ? doctor.getUser().getFirstName() : "") + " " +
                                (doctor.getUser().getLastName() != null ? doctor.getUser().getLastName() : "");
                        doctorName = doctorName.trim();
                    }
                    if (doctor.getSpecialization() != null) {
                        specialization = doctor.getSpecialization();
                    }

                    return PendingOtpResponse.builder()
                            .hasPendingOtp(true)
                            .otp(otp.getOtpCode())
                            .doctorName(doctorName)
                            .specialization(specialization)
                            .expiresAt(otp.getExpiresAt().toString())
                            .build();
                })
                .orElse(PendingOtpResponse.builder()
                        .hasPendingOtp(false)
                        .build());
    }

    // ─── Verify OTP ──────────────────────────────────────────────────────────

    @Transactional
    public OtpVerifyResponse verifyOtp(String doctorId, String patientId, String otpCode) {
        Doctor doctor = doctorRepository.findByDoctorId(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found", "DOCTOR_NOT_FOUND"));

        Patient patient = patientRepository.findByPatientId(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found", "PATIENT_NOT_FOUND"));

        AccessOtp otp = otpRepository
                .findByDoctorAndPatientAndOtpCodeAndUsedFalseAndExpiresAtAfter(
                        doctor, patient, otpCode, LocalDateTime.now())
                .orElseThrow(() -> new BadRequestException(
                        "Invalid or expired OTP. Please request a new one.", "INVALID_OTP"));

        // Mark OTP as used
        otp.setUsed(true);
        otpRepository.save(otp);

        // Map doctor's specialization to MedicalCategory
        MedicalCategory category = SpecializationMapper.toCategory(doctor.getSpecialization());

        // Fetch patient documents filtered by category
        List<PatientDocumentResponse> documents = documentService.getDocuments(patientId, category);

        // Build patient name
        String patientName = "Patient";
        if (patient.getUser() != null) {
            String fn = patient.getUser().getFirstName();
            String ln = patient.getUser().getLastName();
            patientName = ((fn != null ? fn : "") + " " + (ln != null ? ln : "")).trim();
        }

        log.info("OTP verified. Doctor {} accessed {} documents for patient {} (category: {})",
                doctorId, documents.size(), patientId, category);

        return OtpVerifyResponse.builder()
                .verified(true)
                .category(category.name())
                .patientName(patientName)
                .documents(documents)
                .build();
    }
}
