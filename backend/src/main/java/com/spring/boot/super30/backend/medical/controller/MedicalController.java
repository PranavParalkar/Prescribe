package com.spring.boot.super30.backend.medical.controller;

import com.spring.boot.super30.backend.medical.dto.*;
import com.spring.boot.super30.backend.medical.service.InventoryService;
import com.spring.boot.super30.backend.medical.service.MedicalOrderService;
import com.spring.boot.super30.backend.medical.service.MedicalService;
import com.spring.boot.super30.backend.security.service.CustomUserDetails;
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
    private final InventoryService inventoryService;

    // ═════════════════════════════════════════════════════════════════════════
    //  STORE REGISTRATION & PROFILE
    // ═════════════════════════════════════════════════════════════════════════

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

    // ═════════════════════════════════════════════════════════════════════════
    //  INVENTORY MANAGEMENT (Store Owner only)
    // ═════════════════════════════════════════════════════════════════════════

    @PostMapping("/inventory")
    public ResponseEntity<InventoryItemResponse> addInventoryItem(
            @Valid @RequestBody InventoryItemRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(inventoryService.addItem(request, userDetails.getUser()));
    }

    @PutMapping("/inventory/{itemId}")
    public ResponseEntity<InventoryItemResponse> updateInventoryItem(
            @PathVariable UUID itemId,
            @Valid @RequestBody InventoryItemRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(inventoryService.updateItem(itemId, request, userDetails.getUser()));
    }

    @DeleteMapping("/inventory/{itemId}")
    public ResponseEntity<Void> deleteInventoryItem(
            @PathVariable UUID itemId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        inventoryService.deleteItem(itemId, userDetails.getUser());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/inventory")
    public ResponseEntity<List<InventoryItemResponse>> getInventory(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(inventoryService.getInventory(userDetails.getUser()));
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  ALERTS (Store Owner)
    // ═════════════════════════════════════════════════════════════════════════

    @GetMapping("/alerts/low-stock")
    public ResponseEntity<List<InventoryItemResponse>> getLowStockAlerts(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(inventoryService.getLowStockItems(userDetails.getUser()));
    }

    @GetMapping("/alerts/expiring")
    public ResponseEntity<List<InventoryItemResponse>> getExpiringAlerts(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(inventoryService.getExpiringItems(userDetails.getUser()));
    }

    @GetMapping("/dashboard-stats")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(inventoryService.getDashboardStats(userDetails.getUser()));
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  MEDICINE SEARCH (Patient — public search across all stores)
    // ═════════════════════════════════════════════════════════════════════════

    @GetMapping("/search")
    public ResponseEntity<List<MedicineSearchResponse>> searchMedicines(
            @RequestParam String medicine) {
        return ResponseEntity.ok(inventoryService.searchMedicines(medicine));
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  ORDERS
    // ═════════════════════════════════════════════════════════════════════════

    @PostMapping("/orders/place")
    public ResponseEntity<MedicalOrderResponse> placeOrder(
            @Valid @RequestBody PlaceOrderRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(medicalOrderService.placeOrder(request, userDetails.getUser()));
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

    @PostMapping("/orders/{orderId}/create-payment")
    public ResponseEntity<MedicalOrderResponse> createPaymentOrder(
            @PathVariable UUID orderId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(medicalOrderService.createPaymentOrder(orderId, userDetails.getUser()));
    }

    @PostMapping("/orders/{orderId}/accept")
    public ResponseEntity<MedicalOrderResponse> acceptOrder(
            @PathVariable UUID orderId,
            @RequestBody MedicalPaymentVerificationRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(medicalOrderService.verifyPaymentAndAcceptOrder(orderId, request, userDetails.getUser()));
    }

    @PostMapping("/orders/{orderId}/ready")
    public ResponseEntity<MedicalOrderResponse> markReady(
            @PathVariable UUID orderId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(medicalOrderService.markReadyForPickup(orderId, userDetails.getUser()));
    }

    @PostMapping("/orders/{orderId}/complete")
    public ResponseEntity<MedicalOrderResponse> completeOrder(
            @PathVariable UUID orderId,
            @Valid @RequestBody MedicalCompleteRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(medicalOrderService.completeOrder(orderId, request, userDetails.getUser()));
    }
}
