package com.spring.boot.super30.backend.medical.controller;

import com.spring.boot.super30.backend.medical.dto.MedicalCompleteRequest;
import com.spring.boot.super30.backend.medical.dto.MedicalOrderRequest;
import com.spring.boot.super30.backend.medical.dto.MedicalOrderResponse;
import com.spring.boot.super30.backend.medical.dto.MedicalRegistrationRequest;
import com.spring.boot.super30.backend.medical.dto.MedicalRespondRequest;
import com.spring.boot.super30.backend.medical.dto.MedicalResponse;
import com.spring.boot.super30.backend.medical.service.MedicalOrderService;
import com.spring.boot.super30.backend.medical.service.MedicalService;
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
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(medicalService.registerMedical(request, user));
    }

    @GetMapping("/profile")
    public ResponseEntity<MedicalResponse> getMedicalProfile(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(medicalService.getMedicalProfile(user));
    }

    @PostMapping("/orders/forward")
    public ResponseEntity<MedicalOrderResponse> forwardPrescription(
            @Valid @RequestBody MedicalOrderRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(medicalOrderService.forwardPrescription(request, user));
    }

    @GetMapping("/orders/medical")
    public ResponseEntity<List<MedicalOrderResponse>> getOrdersForMedical(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(medicalOrderService.getOrdersForMedical(user));
    }

    @GetMapping("/orders/patient")
    public ResponseEntity<List<MedicalOrderResponse>> getOrdersForPatient(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(medicalOrderService.getOrdersForPatient(user));
    }

    @PostMapping("/orders/{orderId}/respond")
    public ResponseEntity<MedicalOrderResponse> respondToOrder(
            @PathVariable UUID orderId,
            @Valid @RequestBody MedicalRespondRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(medicalOrderService.respondToOrder(orderId, request, user));
    }

    @PostMapping("/orders/{orderId}/accept")
    public ResponseEntity<MedicalOrderResponse> acceptOrder(
            @PathVariable UUID orderId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(medicalOrderService.acceptOrder(orderId, user));
    }

    @PostMapping("/orders/{orderId}/complete")
    public ResponseEntity<MedicalOrderResponse> completeOrder(
            @PathVariable UUID orderId,
            @Valid @RequestBody MedicalCompleteRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(medicalOrderService.completeOrder(orderId, request, user));
    }
}
