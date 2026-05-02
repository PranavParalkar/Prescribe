package com.spring.boot.super30.backend.doctor.controller;

import com.spring.boot.super30.backend.doctor.dto.CreateDoctorRequest;
import com.spring.boot.super30.backend.doctor.dto.DoctorResponse;
import com.spring.boot.super30.backend.doctor.dto.UpdateDoctorRequest;
import com.spring.boot.super30.backend.doctor.service.DoctorService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/doctors")
@Slf4j
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public DoctorResponse createDoctor(@RequestBody CreateDoctorRequest request) {
        log.info("Received request to create a new doctor with email: {}", request.getEmail());
        DoctorResponse response = doctorService.createDoctor(request);
        log.info("Successfully created doctor with ID: {}", response.getDoctorId());
        return response;
    }

    @PatchMapping("/{doctorId}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public DoctorResponse verifyDoctor(@PathVariable String doctorId) {
        log.info("Received request to verify doctor with ID: {}", doctorId);
        DoctorResponse response = doctorService.verifyDoctor(doctorId);
        log.info("Successfully verified doctor with ID: {}", doctorId);
        return response;
    }

    @GetMapping("/email/{email}")
    public DoctorResponse getDoctorByEmail(@PathVariable String email) {
        log.info("Received request to fetch doctor by email: {}", email);
        return doctorService.getDoctorByEmail(email);
    }

    @PostMapping("/{doctorId}/license")
    @PreAuthorize("hasRole('DOCTOR')")
    public DoctorResponse uploadLicense(@PathVariable String doctorId, @RequestParam("file") MultipartFile file) {
        log.info("Received request to upload license for doctor: {}", doctorId);
        return doctorService.uploadLicense(doctorId, file);
    }

    @DeleteMapping("/{doctorId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteDoctor(@PathVariable String doctorId) {
        log.info("Received request to delete doctor with ID: {}", doctorId);
        doctorService.deleteDoctor(doctorId);
        return ResponseEntity.noContent().build();
    }
}