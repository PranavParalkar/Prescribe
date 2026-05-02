package com.spring.boot.super30.backend.document.scheduler;

import com.spring.boot.super30.backend.document.service.PatientDocumentService;
import com.spring.boot.super30.backend.patient.entity.Patient;
import com.spring.boot.super30.backend.patient.repository.PatientRepository;
import com.spring.boot.super30.backend.shared.enums.SubscriptionStatus;
import com.spring.boot.super30.backend.subscription.entity.Subscription;
import com.spring.boot.super30.backend.subscription.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Daily scheduler that manages S3 storage class transitions based on
 * patient subscription status:
 *
 *   Active subscription       → S3 Standard
 *   Expired 0–30 days         → One Zone-IA
 *   Expired 30+ days          → Deep Archive
 *   Re-activated              → Restore to Standard
 */
@Component
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class StorageClassScheduler {

    private final PatientRepository patientRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PatientDocumentService documentService;

    /**
     * Runs daily at 2:00 AM IST to manage storage tier transitions.
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void manageStorageTiers() {
        log.info("=== Starting storage class transition job ===");

        List<Patient> allPatients = patientRepository.findAll();

        for (Patient patient : allPatients) {
            try {
                processPatient(patient);
            } catch (Exception e) {
                log.error("Error processing patient {}: {}", patient.getPatientId(), e.getMessage());
            }
        }

        // Check and complete any pending restores
        documentService.completePendingRestores();

        log.info("=== Storage class transition job completed ===");
    }

    private void processPatient(Patient patient) {
        // Find the most recent subscription
        var latestSub = subscriptionRepository.findTopByPatientOrderByCreatedAtDesc(patient);

        if (latestSub.isEmpty()) {
            // Never subscribed — leave as-is (files uploaded in free tier stay in Standard)
            return;
        }

        Subscription sub = latestSub.get();
        LocalDateTime now = LocalDateTime.now();

        if (sub.getStatus() == SubscriptionStatus.ACTIVE && sub.getEndDate().isAfter(now)) {
            // Active subscription → ensure files are in STANDARD
            documentService.transitionStorageClass(patient, "STANDARD");

        } else if (sub.getEndDate() != null) {
            long daysSinceExpiry = java.time.temporal.ChronoUnit.DAYS.between(sub.getEndDate(), now);

            if (daysSinceExpiry >= 0 && daysSinceExpiry < 30) {
                // Expired 0–30 days → move to ONEZONE_IA
                documentService.transitionStorageClass(patient, "ONEZONE_IA");
                log.info("Patient {} docs → ONEZONE_IA (expired {} days ago)", patient.getPatientId(), daysSinceExpiry);

            } else if (daysSinceExpiry >= 30) {
                // Expired 30+ days → move to DEEP_ARCHIVE
                documentService.transitionStorageClass(patient, "DEEP_ARCHIVE");
                log.info("Patient {} docs → DEEP_ARCHIVE (expired {} days ago)", patient.getPatientId(), daysSinceExpiry);
            }
        }
    }

    /**
     * Called programmatically when a subscription is re-activated.
     * Immediately moves patient files back to STANDARD.
     */
    public void onSubscriptionActivated(Patient patient) {
        log.info("Subscription activated for patient {} — moving docs to STANDARD", patient.getPatientId());
        documentService.transitionStorageClass(patient, "STANDARD");
    }
}
