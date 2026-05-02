package com.spring.boot.super30.backend.patient.controller;

import com.spring.boot.super30.backend.patient.dto.CreatePatientRequest;
import com.spring.boot.super30.backend.patient.dto.PatientResponse;
import com.spring.boot.super30.backend.patient.dto.UpdatePatientRequest;
import com.spring.boot.super30.backend.patient.service.PatientService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.spring.boot.super30.backend.audit.annotation.Auditable;

@RestController
@RequestMapping("/api/patients")
@Slf4j
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
    public PatientResponse createPatient(@RequestBody CreatePatientRequest request) {
        log.info("Received request to create patient: {} {}", request.getFirstName(), request.getLastName());
        PatientResponse response = patientService.createPatient(request);
        log.info("Successfully created patient with ID: {}", response.getPatientId());
        return response;
    }

    @GetMapping("/email/{email}")
    public PatientResponse getPatientByEmail(@PathVariable String email) {
        log.info("Received request to fetch patient by email: {}", email);
        return patientService.getPatientByEmail(email);
    }

    @GetMapping("/{patientId}")
    public PatientResponse getPatientById(@PathVariable String patientId) {
        log.info("Received request to fetch patient by ID: {}", patientId);
        return patientService.getPatientById(patientId);
    }

    @PutMapping("/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
    public ResponseEntity<?> updatePatientProfile(@PathVariable String patientId, @Valid @RequestBody UpdatePatientRequest request) {
        log.info("Received request to update patient profile for ID: {}", patientId);
        try {
            return ResponseEntity.ok(patientService.updatePatientProfile(patientId, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{patientId}/export")
    @PreAuthorize("hasRole('PATIENT')")
    @Auditable(action = "EXPORT_PATIENT_DATA", resourceType = "PATIENT")
    public ResponseEntity<String> exportPatientData(@PathVariable String patientId) {
        log.info("Received request to export data for patient ID: {}", patientId);
        String exportedData = patientService.exportPatientData(patientId);
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=patient_data.json");
        return ResponseEntity.ok().headers(headers).body(exportedData);
    }

    @DeleteMapping("/{patientId}")
    @PreAuthorize("hasRole('PATIENT')")
    @Auditable(action = "DELETE_PATIENT_ACCOUNT", resourceType = "PATIENT")
    public ResponseEntity<Void> deletePatientAccount(@PathVariable String patientId) {
        log.info("Received request to delete/anonymize patient account ID: {}", patientId);
        patientService.deletePatientAccount(patientId);
        return ResponseEntity.noContent().build();
    }
}