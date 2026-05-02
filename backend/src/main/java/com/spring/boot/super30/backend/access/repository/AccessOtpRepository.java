package com.spring.boot.super30.backend.access.repository;

import com.spring.boot.super30.backend.access.entity.AccessOtp;
import com.spring.boot.super30.backend.doctor.entity.Doctor;
import com.spring.boot.super30.backend.patient.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AccessOtpRepository extends JpaRepository<AccessOtp, UUID> {

    /**
     * Find the latest pending (unused, not expired) OTP for a patient.
     */
    Optional<AccessOtp> findFirstByPatientAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            Patient patient, LocalDateTime now);

    /**
     * Find a specific OTP for verification.
     */
    Optional<AccessOtp> findByDoctorAndPatientAndOtpCodeAndUsedFalseAndExpiresAtAfter(
            Doctor doctor, Patient patient, String otpCode, LocalDateTime now);

    /**
     * Invalidate all existing unused OTPs for a doctor-patient pair.
     */
    List<AccessOtp> findByDoctorAndPatientAndUsedFalse(Doctor doctor, Patient patient);

    /**
     * Cleanup expired OTPs.
     */
    void deleteByExpiresAtBefore(LocalDateTime cutoff);
}
