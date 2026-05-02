package com.spring.boot.super30.backend.prescription.controller;

import com.spring.boot.super30.backend.doctor.entity.Doctor;
import com.spring.boot.super30.backend.doctor.repository.DoctorRepository;
import com.spring.boot.super30.backend.exception.custom.ResourceNotFoundException;
import com.spring.boot.super30.backend.patient.entity.Patient;
import com.spring.boot.super30.backend.patient.repository.PatientRepository;
import com.spring.boot.super30.backend.prescription.dto.CreatePrescriptionRequest;
import com.spring.boot.super30.backend.prescription.dto.PrescriptionResponse;
import com.spring.boot.super30.backend.prescription.entity.Prescription;
import com.spring.boot.super30.backend.prescription.repository.PrescriptionRepository;
import com.spring.boot.super30.backend.prescription.service.PrescriptionService;
import com.spring.boot.super30.backend.subscription.service.SubscriptionService;
import com.spring.boot.super30.backend.audit.annotation.Auditable;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/prescriptions")
@RequiredArgsConstructor
@Slf4j
public class PrescriptionController {

    private final PrescriptionService prescriptionService;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final SubscriptionService subscriptionService;

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<PrescriptionResponse> createPrescription(
            @RequestParam String patientId,
            @RequestParam String doctorId,
            @Valid @RequestBody CreatePrescriptionRequest prescription) {
        log.info("Request to create prescription for patient ID: {}, doctor ID: {}", patientId, doctorId);
        PrescriptionResponse created = prescriptionService.createPrescription(patientId, doctorId, prescription);
        log.info("Successfully created prescription ID: {}", created.getId());
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}/revoke")
    @PreAuthorize("hasRole('DOCTOR')")
    @Auditable(action = "REVOKE_PRESCRIPTION", resourceType = "PRESCRIPTION")
    public ResponseEntity<PrescriptionResponse> revokePrescription(
            @PathVariable UUID id,
            @RequestBody com.spring.boot.super30.backend.prescription.dto.RevokePrescriptionRequest request) {
        log.info("Request to revoke prescription ID: {} with reason: {}", id, request.getReason());
        PrescriptionResponse revoked = prescriptionService.revokePrescription(id, request.getReason());
        log.info("Successfully revoked prescription ID: {}", id);
        return ResponseEntity.ok(revoked);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    @Auditable(action = "UPDATE_PRESCRIPTION", resourceType = "PRESCRIPTION")
    public ResponseEntity<PrescriptionResponse> updatePrescription(
            @PathVariable UUID id,
            @Valid @RequestBody CreatePrescriptionRequest updateRequest) {
        log.info("Request to update prescription ID: {}", id);
        PrescriptionResponse updated = prescriptionService.updatePrescription(id, updateRequest);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    @Auditable(action = "VIEW_PATIENT_PRESCRIPTIONS", resourceType = "PATIENT")
    public ResponseEntity<Map<String, Object>> getPatientPrescriptions(@PathVariable String patientId) {
        log.info("Fetching prescriptions for patient ID: {}", patientId);
        List<PrescriptionResponse> prescriptions = prescriptionService.getPatientPrescriptions(patientId);

        boolean hasFullAccess = subscriptionService.hasFullAccess(patientId);
        int freeLimit = 3; // matches application.yaml default
        int currentLimit = subscriptionService.getPrescriptionLimit(patientId);
        boolean limitReached = prescriptions.size() >= currentLimit;

        Map<String, Object> response = new HashMap<>();
        response.put("prescriptions", prescriptions);
        response.put("hasFullAccess", hasFullAccess);
        response.put("freeLimit", freeLimit);
        response.put("premiumLimit", 50);
        response.put("currentLimit", currentLimit);
        response.put("limitReached", limitReached);
        response.put("totalCount", prescriptions.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public List<PrescriptionResponse> getDoctorPrescriptions(@PathVariable String doctorId) {
        log.info("Fetching prescriptions for doctor ID: {}", doctorId);
        return prescriptionService.getDoctorPrescriptions(doctorId);
    }

}

