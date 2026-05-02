package com.spring.boot.super30.backend.doctor.controller;

import com.spring.boot.super30.backend.doctor.dto.DoctorResponse;
import com.spring.boot.super30.backend.doctor.service.DoctorService;
import com.spring.boot.super30.backend.document.service.S3StorageService;
import com.spring.boot.super30.backend.patient.dto.PatientResponse;
import com.spring.boot.super30.backend.patient.service.PatientService;
import com.spring.boot.super30.backend.medical.dto.MedicalResponse;
import com.spring.boot.super30.backend.medical.service.MedicalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
public class AdminController {

    private final DoctorService doctorService;
    private final PatientService patientService;
    private final MedicalService medicalService;
    private final S3StorageService s3StorageService;

    @GetMapping("/doctors/pending")
    public ResponseEntity<List<DoctorResponse>> getPendingDoctors() {
        log.info("Admin requesting pending doctors list");
        List<DoctorResponse> pendingDoctors = doctorService.getPendingDoctors();
        return ResponseEntity.ok(pendingDoctors);
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<DoctorResponse>> getAllDoctors() {
        log.info("Admin requesting all doctors list");
        return ResponseEntity.ok(doctorService.getAllDoctors());
    }

    @GetMapping("/patients")
    public ResponseEntity<List<PatientResponse>> getAllPatients() {
        log.info("Admin requesting all patients list");
        return ResponseEntity.ok(patientService.getAllPatients());
    }

    @GetMapping("/medicals")
    public ResponseEntity<List<MedicalResponse>> getAllMedicals() {
        log.info("Admin requesting all medical stores list");
        return ResponseEntity.ok(medicalService.getAllMedicals());
    }

    @PostMapping("/doctors/{doctorId}/approve")
    public ResponseEntity<DoctorResponse> approveDoctor(@PathVariable String doctorId) {
        log.info("Admin approving doctor: {}", doctorId);
        DoctorResponse response = doctorService.verifyDoctor(doctorId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/doctors/{doctorId}/reject")
    public ResponseEntity<DoctorResponse> rejectDoctor(@PathVariable String doctorId) {
        log.info("Admin rejecting doctor: {}", doctorId);
        DoctorResponse response = doctorService.rejectDoctor(doctorId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/doctors/{doctorId}/license-url")
    public ResponseEntity<?> getLicenseViewUrl(@PathVariable String doctorId) {
        log.info("Admin requesting license view URL for doctor: {}", doctorId);
        DoctorResponse doctor = doctorService.getDoctorById(doctorId);
        if (doctor.getLicenseDocumentUrl() == null || doctor.getLicenseDocumentUrl().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "No license document uploaded"));
        }
        String url = s3StorageService.generateViewUrl(doctor.getLicenseDocumentUrl(), null);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @DeleteMapping("/doctors/{doctorId}")
    public ResponseEntity<Void> deleteDoctor(@PathVariable String doctorId) {
        log.info("Admin deleting doctor: {}", doctorId);
        doctorService.deleteDoctor(doctorId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/patients/{patientId}")
    public ResponseEntity<Void> deletePatient(@PathVariable String patientId) {
        log.info("Admin deleting patient: {}", patientId);
        patientService.deletePatientAccount(patientId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/medicals/{medicalId}")
    public ResponseEntity<Void> deleteMedical(@PathVariable String medicalId) {
        log.info("Admin deleting medical store: {}", medicalId);
        medicalService.deleteMedical(medicalId);
        return ResponseEntity.noContent().build();
    }
}
