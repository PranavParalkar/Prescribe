package com.spring.boot.super30.backend.subscription.controller;

import com.spring.boot.super30.backend.subscription.dto.CreateOrderResponse;
import com.spring.boot.super30.backend.subscription.dto.SubscriptionStatusResponse;
import com.spring.boot.super30.backend.subscription.dto.VerifyPaymentRequest;
import com.spring.boot.super30.backend.subscription.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/subscription")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PATIENT')")
@Slf4j
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    /**
     * Get current subscription status for a patient.
     * Returns free-tier info, active subscription details, or whether upgrade is needed.
     */
    @GetMapping("/status")
    public ResponseEntity<SubscriptionStatusResponse> getStatus(@RequestParam String patientId) {
        log.info("GET /api/subscription/status for patient: {}", patientId);
        SubscriptionStatusResponse status = subscriptionService.getSubscriptionStatus(patientId);
        return ResponseEntity.ok(status);
    }

    /**
     * Create a Razorpay order for subscription payment.
     * Returns order details needed by the frontend checkout popup.
     */
    @PostMapping("/create-order")
    public ResponseEntity<CreateOrderResponse> createOrder(@RequestParam String patientId) {
        log.info("POST /api/subscription/create-order for patient: {}", patientId);
        CreateOrderResponse order = subscriptionService.createOrder(patientId);
        return ResponseEntity.ok(order);
    }

    /**
     * Verify Razorpay payment signature and activate the subscription.
     * Called by the frontend after successful checkout.
     */
    @PostMapping("/verify-payment")
    public ResponseEntity<SubscriptionStatusResponse> verifyPayment(@RequestBody VerifyPaymentRequest request) {
        log.info("POST /api/subscription/verify-payment for order: {}", request.getRazorpayOrderId());
        SubscriptionStatusResponse status = subscriptionService.verifyPayment(request);
        return ResponseEntity.ok(status);
    }
}
