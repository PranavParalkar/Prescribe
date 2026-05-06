package com.spring.boot.super30.backend.medical.controller;

import com.spring.boot.super30.backend.medical.dto.MedicalCompleteRequest;
import com.spring.boot.super30.backend.medical.dto.MedicalOrderRequest;
import com.spring.boot.super30.backend.medical.dto.MedicalOrderResponse;
import com.spring.boot.super30.backend.medical.dto.MedicalRegistrationRequest;
import com.spring.boot.super30.backend.medical.dto.MedicalRespondRequest;
import com.spring.boot.super30.backend.medical.dto.MedicalResponse;
import com.spring.boot.super30.backend.medical.service.MedicalOrderService;
import com.spring.boot.super30.backend.medical.service.MedicalService;
import com.spring.boot.super30.backend.security.service.CustomUserDetails;
import com.spring.boot.super30.backend.shared.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/medicals")
@RequiredArgsConstructor
public class MedicalController {

    private final MedicalService medicalService;
    private final MedicalOrderService medicalOrderService;

    @PostMapping("/register")
    public ResponseEntity<MedicalResponse> registerMedical(
            @Valid @RequestBody MedicalRegistrationRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(medicalService.registerMedical(request, userDetails.getUser()));
    }

    @GetMapping("/profile")
    public ResponseEntity<MedicalResponse> getMedicalProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(medicalService.getMedicalProfile(userDetails.getUser()));
    }

    @PostMapping("/orders/forward")
    public ResponseEntity<MedicalOrderResponse> forwardPrescription(
            @Valid @RequestBody MedicalOrderRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(medicalOrderService.forwardPrescription(request, userDetails.getUser()));
    }

    @GetMapping("/orders/medical")
    public ResponseEntity<List<MedicalOrderResponse>> getOrdersForMedical(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(medicalOrderService.getOrdersForMedical(userDetails.getUser()));
    }

    @GetMapping("/orders/patient")
    public ResponseEntity<List<MedicalOrderResponse>> getOrdersForPatient(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(medicalOrderService.getOrdersForPatient(userDetails.getUser()));
    }

    @PostMapping("/orders/{orderId}/respond")
    public ResponseEntity<MedicalOrderResponse> respondToOrder(
            @PathVariable UUID orderId,
            @Valid @RequestBody MedicalRespondRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(medicalOrderService.respondToOrder(orderId, request, userDetails.getUser()));
    }

    @PostMapping("/orders/{orderId}/create-payment")
    public ResponseEntity<MedicalOrderResponse> createPaymentOrder(
            @PathVariable UUID orderId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(medicalOrderService.createPaymentOrder(orderId, userDetails.getUser()));
    }

    @PostMapping("/orders/{orderId}/accept")
    public ResponseEntity<MedicalOrderResponse> acceptOrder(
            @PathVariable UUID orderId,
            @RequestBody com.spring.boot.super30.backend.medical.dto.MedicalPaymentVerificationRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(medicalOrderService.verifyPaymentAndAcceptOrder(orderId, request, userDetails.getUser()));
    }

    @PostMapping("/orders/{orderId}/complete")
    public ResponseEntity<MedicalOrderResponse> completeOrder(
            @PathVariable UUID orderId,
            @Valid @RequestBody MedicalCompleteRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(medicalOrderService.completeOrder(orderId, request, userDetails.getUser()));
    }
}
