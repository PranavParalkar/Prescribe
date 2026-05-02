package com.spring.boot.super30.backend.access.controller;

import com.spring.boot.super30.backend.access.dto.OtpRequestResponse;
import com.spring.boot.super30.backend.access.dto.OtpVerifyRequest;
import com.spring.boot.super30.backend.access.dto.OtpVerifyResponse;
import com.spring.boot.super30.backend.access.dto.PendingOtpResponse;
import com.spring.boot.super30.backend.access.service.AccessOtpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.spring.boot.super30.backend.audit.annotation.Auditable;

@RestController
@RequestMapping("/api/access")
@RequiredArgsConstructor
@Slf4j
public class AccessOtpController {

    private final AccessOtpService accessOtpService;

    /**
     * Doctor requests OTP to access a patient's documents.
     * The OTP will appear on the patient's dashboard.
     */
    @PostMapping("/request-otp")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<OtpRequestResponse> requestOtp(
            @RequestParam String doctorId,
            @RequestParam String patientId) {

        log.info("POST /api/access/request-otp - doctor: {}, patient: {}", doctorId, patientId);
        OtpRequestResponse response = accessOtpService.requestOtp(doctorId, patientId);
        return ResponseEntity.ok(response);
    }

    /**
     * Patient polls this endpoint to check for any pending OTP.
     */
    @GetMapping("/pending-otp")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<PendingOtpResponse> getPendingOtp(
            @RequestParam String patientId) {

        log.info("GET /api/access/pending-otp - patient: {}", patientId);
        PendingOtpResponse response = accessOtpService.getPendingOtp(patientId);
        return ResponseEntity.ok(response);
    }

    /**
     * Doctor submits OTP to verify and get access to patient documents.
     * Returns documents filtered by the doctor's specialization category.
     */
    @PostMapping("/verify-otp")
    @PreAuthorize("hasRole('DOCTOR')")
    @Auditable(action = "VERIFY_ACCESS_OTP", resourceType = "PATIENT")
    public ResponseEntity<OtpVerifyResponse> verifyOtp(
            @RequestParam String doctorId,
            @RequestBody OtpVerifyRequest request) {

        log.info("POST /api/access/verify-otp - doctor: {}, patient: {}", doctorId, request.getPatientId());
        OtpVerifyResponse response = accessOtpService.verifyOtp(
                doctorId, request.getPatientId(), request.getOtp());
        return ResponseEntity.ok(response);
    }
}
