package com.spring.boot.super30.backend.subscription.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import com.spring.boot.super30.backend.exception.custom.BadRequestException;
import com.spring.boot.super30.backend.exception.custom.ResourceNotFoundException;
import com.spring.boot.super30.backend.patient.entity.Patient;
import com.spring.boot.super30.backend.patient.repository.PatientRepository;
import com.spring.boot.super30.backend.prescription.entity.Prescription;
import com.spring.boot.super30.backend.prescription.repository.PrescriptionRepository;
import com.spring.boot.super30.backend.shared.enums.SubscriptionStatus;
import com.spring.boot.super30.backend.subscription.dto.CreateOrderResponse;
import com.spring.boot.super30.backend.subscription.dto.SubscriptionStatusResponse;
import com.spring.boot.super30.backend.subscription.dto.VerifyPaymentRequest;
import com.spring.boot.super30.backend.subscription.entity.Subscription;
import com.spring.boot.super30.backend.subscription.repository.SubscriptionRepository;
import com.spring.boot.super30.backend.document.scheduler.StorageClassScheduler;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final PatientRepository patientRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final StorageClassScheduler storageClassScheduler;

    @Value("${razorpay.key-id}")
    private String razorpayKeyId;

    @Value("${razorpay.key-secret}")
    private String razorpayKeySecret;

    @Value("${subscription.free-document-limit:3}")
    private int freeDocumentLimit;

    @Value("${subscription.premium-document-limit:50}")
    private int premiumDocumentLimit;

    @Value("${subscription.monthly-price-paise:2900}")
    private int monthlyPricePaise;

    @Value("${subscription.plan-name:Prescribe Pro}")
    private String planName;

    private RazorpayClient razorpayClient;

    @PostConstruct
    public void init() {
        try {
            this.razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            log.info("Razorpay client initialized successfully");
        } catch (RazorpayException e) {
            log.error("Failed to initialize Razorpay client: {}", e.getMessage());
        }
    }

    // ─── Subscription Status ─────────────────────────────────────────────────

    public SubscriptionStatusResponse getSubscriptionStatus(String patientId) {
        log.info("Fetching subscription status for patient: {}", patientId);

        Patient patient = findPatient(patientId);
        List<Prescription> prescriptions = prescriptionRepository.findByPatient(patient);
        int totalPrescriptions = prescriptions.size();

        Optional<Subscription> activeSub = subscriptionRepository
                .findByPatientAndStatus(patient, SubscriptionStatus.ACTIVE);

        // Check if active subscription has expired
        if (activeSub.isPresent() && activeSub.get().getEndDate() != null
                && activeSub.get().getEndDate().isBefore(LocalDateTime.now())) {
            Subscription sub = activeSub.get();
            sub.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(sub);
            activeSub = Optional.empty();
            log.info("Subscription expired for patient: {}", patientId);
        }

        boolean isSubscribed = activeSub.isPresent();
        boolean requiresSubscription = totalPrescriptions > freeDocumentLimit && !isSubscribed;
        int currentLimit = isSubscribed ? premiumDocumentLimit : freeDocumentLimit;
        boolean limitReached = totalPrescriptions >= currentLimit;

        int daysRemaining = 0;
        if (isSubscribed && activeSub.get().getEndDate() != null) {
            daysRemaining = (int) ChronoUnit.DAYS.between(LocalDateTime.now(), activeSub.get().getEndDate());
            if (daysRemaining < 0) daysRemaining = 0;
        }

        return SubscriptionStatusResponse.builder()
                .subscribed(isSubscribed)
                .planType(isSubscribed ? activeSub.get().getPlanType() : "FREE")
                .status(isSubscribed ? "ACTIVE" : (requiresSubscription ? "REQUIRED" : "FREE"))
                .startDate(isSubscribed ? activeSub.get().getStartDate().toString() : null)
                .endDate(isSubscribed ? activeSub.get().getEndDate().toString() : null)
                .totalPrescriptions(totalPrescriptions)
                .freeLimit(freeDocumentLimit)
                .premiumLimit(premiumDocumentLimit)
                .currentLimit(currentLimit)
                .limitReached(limitReached)
                .requiresSubscription(requiresSubscription)
                .daysRemaining(daysRemaining)
                .build();
    }

    // ─── Create Razorpay Order ───────────────────────────────────────────────

    @Transactional
    public CreateOrderResponse createOrder(String patientId) {
        log.info("Creating Razorpay order for patient: {}", patientId);

        Patient patient = findPatient(patientId);

        // Check if already has active subscription
        Optional<Subscription> activeSub = subscriptionRepository
                .findByPatientAndStatus(patient, SubscriptionStatus.ACTIVE);
        if (activeSub.isPresent() && activeSub.get().getEndDate().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("Patient already has an active subscription", "ALREADY_SUBSCRIBED");
        }

        try {
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", monthlyPricePaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "rx_sub_" + patientId + "_" + System.currentTimeMillis());
            orderRequest.put("payment_capture", 1); // Auto‑capture

            Order razorpayOrder = razorpayClient.orders.create(orderRequest);
            String orderId = razorpayOrder.get("id");

            log.info("Razorpay order created: {}", orderId);

            // Persist subscription in CREATED state
            Subscription subscription = new Subscription();
            subscription.setPatient(patient);
            subscription.setPlanType(planName);
            subscription.setStatus(SubscriptionStatus.CREATED);
            subscription.setAmount(monthlyPricePaise);
            subscription.setCurrency("INR");
            subscription.setRazorpayOrderId(orderId);
            subscriptionRepository.save(subscription);

            return CreateOrderResponse.builder()
                    .orderId(orderId)
                    .amount(monthlyPricePaise)
                    .currency("INR")
                    .keyId(razorpayKeyId)
                    .planName(planName)
                    .build();

        } catch (RazorpayException e) {
            log.error("Failed to create Razorpay order: {}", e.getMessage());
            throw new BadRequestException("Failed to create payment order: " + e.getMessage(),
                    "RAZORPAY_ORDER_FAILED");
        }
    }

    // ─── Verify Payment ──────────────────────────────────────────────────────

    @Transactional
    public SubscriptionStatusResponse verifyPayment(VerifyPaymentRequest request) {
        log.info("Verifying payment for order: {}", request.getRazorpayOrderId());

        // 1. Verify Razorpay signature
        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", request.getRazorpayOrderId());
            options.put("razorpay_payment_id", request.getRazorpayPaymentId());
            options.put("razorpay_signature", request.getRazorpaySignature());

            boolean isValid = Utils.verifyPaymentSignature(options, razorpayKeySecret);
            if (!isValid) {
                log.error("Payment signature verification failed for order: {}", request.getRazorpayOrderId());
                throw new BadRequestException("Payment verification failed", "PAYMENT_VERIFICATION_FAILED");
            }
        } catch (RazorpayException e) {
            log.error("Error verifying payment signature: {}", e.getMessage());
            throw new BadRequestException("Payment verification error: " + e.getMessage(),
                    "PAYMENT_VERIFICATION_ERROR");
        }

        // 2. Find the subscription record
        Subscription subscription = subscriptionRepository
                .findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Subscription not found for order", "SUBSCRIPTION_NOT_FOUND"));

        // 3. Activate subscription
        LocalDateTime now = LocalDateTime.now();
        subscription.setRazorpayPaymentId(request.getRazorpayPaymentId());
        subscription.setRazorpaySignature(request.getRazorpaySignature());
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setStartDate(now);
        subscription.setEndDate(now.plusDays(30));
        subscriptionRepository.save(subscription);

        log.info("Subscription activated for patient: {}, valid until: {}",
                subscription.getPatient().getPatientId(), subscription.getEndDate());

        // 4. Trigger storage class upgrade for patient's documents
        try {
            storageClassScheduler.onSubscriptionActivated(subscription.getPatient());
        } catch (Exception e) {
            log.warn("Could not upgrade document storage classes: {}", e.getMessage());
        }

        // 5. Return updated status
        return getSubscriptionStatus(request.getPatientId());
    }

    // ─── Access Check ────────────────────────────────────────────────────────

    /**
     * Checks whether a patient can access prescriptions beyond the free limit.
     * Returns true if the patient has fewer than freeDocumentLimit prescriptions,
     * or has an active subscription.
     */
    public boolean hasFullAccess(String patientId) {
        Patient patient = findPatient(patientId);
        List<Prescription> prescriptions = prescriptionRepository.findByPatient(patient);

        if (prescriptions.size() <= freeDocumentLimit) {
            return true;
        }

        Optional<Subscription> activeSub = subscriptionRepository
                .findByPatientAndStatus(patient, SubscriptionStatus.ACTIVE);

        return activeSub.isPresent() && activeSub.get().getEndDate().isAfter(LocalDateTime.now());
    }

    /**
     * Checks whether a patient can create a new prescription based on their tier limit.
     * Free users: max 3 prescriptions. Premium users: max 50 prescriptions.
     */
    public boolean canCreatePrescription(String patientId) {
        Patient patient = findPatient(patientId);
        long count = prescriptionRepository.countByPatient(patient);

        Optional<Subscription> activeSub = subscriptionRepository
                .findByPatientAndStatus(patient, SubscriptionStatus.ACTIVE);
        boolean isSubscribed = activeSub.isPresent()
                && activeSub.get().getEndDate().isAfter(LocalDateTime.now());

        int limit = isSubscribed ? premiumDocumentLimit : freeDocumentLimit;
        return count < limit;
    }

    /**
     * Returns the maximum number of prescriptions the patient can have.
     */
    public int getPrescriptionLimit(String patientId) {
        Patient patient = findPatient(patientId);
        Optional<Subscription> activeSub = subscriptionRepository
                .findByPatientAndStatus(patient, SubscriptionStatus.ACTIVE);
        boolean isSubscribed = activeSub.isPresent()
                && activeSub.get().getEndDate().isAfter(LocalDateTime.now());
        return isSubscribed ? premiumDocumentLimit : freeDocumentLimit;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Patient findPatient(String patientId) {
        return patientRepository.findByPatientId(patientId)
                .orElseThrow(() -> {
                    log.error("Patient not found with ID: {}", patientId);
                    return new ResourceNotFoundException("Patient not found", "PATIENT_NOT_FOUND");
                });
    }
}
