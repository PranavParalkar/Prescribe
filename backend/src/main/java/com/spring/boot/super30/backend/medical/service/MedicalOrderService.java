package com.spring.boot.super30.backend.medical.service;

import com.spring.boot.super30.backend.medical.dto.*;
import com.spring.boot.super30.backend.medical.entity.*;
import com.spring.boot.super30.backend.medical.repository.*;
import com.spring.boot.super30.backend.patient.entity.Patient;
import com.spring.boot.super30.backend.patient.repository.PatientRepository;
import com.spring.boot.super30.backend.prescription.entity.Prescription;
import com.spring.boot.super30.backend.prescription.repository.PrescriptionRepository;
import com.spring.boot.super30.backend.shared.entity.User;
import com.spring.boot.super30.backend.shared.enums.MedicalOrderStatus;
import com.spring.boot.super30.backend.shared.enums.UserRole;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MedicalOrderService {

    private final MedicalOrderRepository medicalOrderRepository;
    private final MedicalRepository medicalRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PatientRepository patientRepository;
    private final InventoryItemRepository inventoryItemRepository;

    @Value("${razorpay.key-id}")
    private String razorpayKeyId;

    @Value("${razorpay.key-secret}")
    private String razorpayKeySecret;

    private RazorpayClient razorpayClient;

    @PostConstruct
    public void init() {
        try {
            this.razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            log.info("Razorpay client initialized in MedicalOrderService");
        } catch (Exception e) {
            log.error("Failed to initialize Razorpay client: {}", e.getMessage());
        }
    }

    // ─── Place Order (Patient) ───────────────────────────────────────────────
    // Patient selects items from inventory search results, places order directly

    @Transactional
    public MedicalOrderResponse placeOrder(PlaceOrderRequest request, User currentUser) {
        Patient patient = patientRepository.findByUserEmail(currentUser.getEmail())
                .orElseThrow(() -> new RuntimeException("Patient profile not found"));

        Medical medical = medicalRepository.findByMedicalId(request.getMedicalId())
                .orElseThrow(() -> new RuntimeException("Medical store not found"));

        MedicalOrder order = new MedicalOrder();
        order.setPatient(patient);
        order.setMedical(medical);
        order.setStatus(MedicalOrderStatus.CONFIRMED);

        // Link prescription if provided
        if (request.getPrescriptionId() != null) {
            Prescription prescription = prescriptionRepository.findById(request.getPrescriptionId())
                    .orElse(null);
            order.setPrescription(prescription);
        }

        // Build order items & compute total
        double totalCost = 0;
        List<OrderItem> orderItems = new ArrayList<>();
        StringBuilder itemsSummary = new StringBuilder();

        for (PlaceOrderRequest.OrderItemEntry entry : request.getItems()) {
            InventoryItem invItem = inventoryItemRepository.findById(entry.getInventoryItemId())
                    .orElseThrow(() -> new RuntimeException("Inventory item not found: " + entry.getInventoryItemId()));

            if (!invItem.getMedical().getId().equals(medical.getId())) {
                throw new RuntimeException("Item does not belong to selected store");
            }

            if (!invItem.getActive()) {
                throw new RuntimeException("Item is no longer available: " + invItem.getMedicineName());
            }

            if (invItem.getQuantity() < entry.getQuantity()) {
                throw new RuntimeException("Insufficient stock for " + invItem.getMedicineName()
                        + ". Available: " + invItem.getQuantity() + ", Requested: " + entry.getQuantity());
            }

            // Decrement stock
            invItem.setQuantity(invItem.getQuantity() - entry.getQuantity());
            inventoryItemRepository.save(invItem);

            double subtotal = invItem.getPrice() * entry.getQuantity();
            totalCost += subtotal;

            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setInventoryItem(invItem);
            oi.setMedicineName(invItem.getMedicineName());
            oi.setQuantity(entry.getQuantity());
            oi.setUnitPrice(invItem.getPrice());
            oi.setSubtotal(subtotal);
            orderItems.add(oi);

            itemsSummary.append(invItem.getMedicineName())
                    .append(" x").append(entry.getQuantity())
                    .append(" @ ₹").append(invItem.getPrice())
                    .append("\n");
        }

        order.setItems(orderItems);
        order.setTotalCost(totalCost);
        order.setAvailableItems(itemsSummary.toString().trim());

        return mapToResponse(medicalOrderRepository.save(order));
    }

    // ─── Create Razorpay Payment Order ───────────────────────────────────────

    @Transactional
    public MedicalOrderResponse createPaymentOrder(UUID orderId, User currentUser) {
        MedicalOrder order = medicalOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Medical order not found"));

        if (!order.getPatient().getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Not authorized to pay for this order");
        }

        if (order.getStatus() != MedicalOrderStatus.CONFIRMED && order.getStatus() != MedicalOrderStatus.PENDING_PAYMENT) {
            throw new RuntimeException("Order is not in CONFIRMED or PENDING_PAYMENT status");
        }

        try {
            int amountInPaise = (int) (order.getTotalCost() * 100);
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "rx_med_" + order.getId().toString().substring(0, 8) + "_" + System.currentTimeMillis());
            orderRequest.put("payment_capture", 1);

            Order razorpayOrder = razorpayClient.orders.create(orderRequest);
            String rzOrderId = razorpayOrder.get("id");

            order.setRazorpayOrderId(rzOrderId);
            medicalOrderRepository.save(order);

            MedicalOrderResponse response = mapToResponse(order);
            response.setRazorpayOrderId(rzOrderId);
            response.setRazorpayKeyId(razorpayKeyId);
            return response;

        } catch (Exception e) {
            log.error("Failed to create Razorpay order for medical order: {}", e.getMessage());
            throw new RuntimeException("Failed to create payment order: " + e.getMessage());
        }
    }

    // ─── Verify Payment ──────────────────────────────────────────────────────

    @Transactional
    public MedicalOrderResponse verifyPaymentAndAcceptOrder(UUID orderId, MedicalPaymentVerificationRequest request, User currentUser) {
        MedicalOrder order = medicalOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Medical order not found"));

        if (!order.getPatient().getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Not authorized");
        }

        if (order.getStatus() != MedicalOrderStatus.CONFIRMED && order.getStatus() != MedicalOrderStatus.PENDING_PAYMENT) {
            throw new RuntimeException("Order is not in CONFIRMED or PENDING_PAYMENT status");
        }

        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", request.getRazorpayOrderId());
            options.put("razorpay_payment_id", request.getRazorpayPaymentId());
            options.put("razorpay_signature", request.getRazorpaySignature());

            boolean isValid = Utils.verifyPaymentSignature(options, razorpayKeySecret);
            if (!isValid) {
                throw new RuntimeException("Payment verification failed");
            }
        } catch (Exception e) {
            throw new RuntimeException("Payment verification error: " + e.getMessage());
        }

        order.setRazorpayPaymentId(request.getRazorpayPaymentId());
        order.setRazorpaySignature(request.getRazorpaySignature());
        order.setStatus(MedicalOrderStatus.ACCEPTED);

        return mapToResponse(medicalOrderRepository.save(order));
    }

    // ─── Mark Ready for Pickup (Store Owner) ─────────────────────────────────

    @Transactional
    public MedicalOrderResponse markReadyForPickup(UUID orderId, User currentUser) {
        MedicalOrder order = medicalOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Medical order not found"));

        Medical medical = medicalRepository.findByUser(currentUser)
                .orElseThrow(() -> new RuntimeException("Medical profile not found"));

        if (!order.getMedical().getId().equals(medical.getId())) {
            throw new RuntimeException("Not authorized");
        }

        if (order.getStatus() != MedicalOrderStatus.CONFIRMED && order.getStatus() != MedicalOrderStatus.ACCEPTED) {
            throw new RuntimeException("Order must be CONFIRMED or ACCEPTED");
        }

        order.setStatus(MedicalOrderStatus.READY_FOR_PICKUP);
        return mapToResponse(medicalOrderRepository.save(order));
    }

    // ─── Complete Order (Store Owner verifies Patient ID) ────────────────────

    @Transactional
    public MedicalOrderResponse completeOrder(UUID orderId, MedicalCompleteRequest request, User currentUser) {
        MedicalOrder order = medicalOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Medical order not found"));

        Medical medical = medicalRepository.findByUser(currentUser)
                .orElseThrow(() -> new RuntimeException("Medical profile not found"));

        if (!order.getMedical().getId().equals(medical.getId())) {
            throw new RuntimeException("Not authorized to complete this order");
        }

        if (order.getStatus() != MedicalOrderStatus.READY_FOR_PICKUP && order.getStatus() != MedicalOrderStatus.ACCEPTED) {
            throw new RuntimeException("Order must be READY_FOR_PICKUP or ACCEPTED before completion");
        }

        if (!order.getPatient().getPatientId().equals(request.getPatientId())) {
            throw new RuntimeException("Invalid Patient ID provided");
        }

        order.setStatus(MedicalOrderStatus.COMPLETED);
        return mapToResponse(medicalOrderRepository.save(order));
    }

    // ─── Confirm / Respond to Request (Store Owner) ────────────────────────────

    @Transactional
    public MedicalOrderResponse confirmOrder(UUID orderId, MedicalRespondRequest request, User currentUser) {
        MedicalOrder order = medicalOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Medical order not found"));

        Medical medical = medicalRepository.findByUser(currentUser)
                .orElseThrow(() -> new RuntimeException("Medical profile not found"));

        if (!order.getMedical().getId().equals(medical.getId())) {
            throw new RuntimeException("Not authorized");
        }

        if (order.getStatus() != MedicalOrderStatus.REQUESTED) {
            throw new RuntimeException("Order must be in REQUESTED status to confirm");
        }

        order.setAvailableItems(request.getAvailableItems());
        order.setTotalCost(request.getTotalCost());
        order.setStatus(MedicalOrderStatus.PENDING_PAYMENT);

        return mapToResponse(medicalOrderRepository.save(order));
    }

    // ─── Forward Prescription (Legacy — still supported) ─────────────────────

    @Transactional
    public MedicalOrderResponse forwardPrescription(MedicalOrderRequest request, User currentUser) {
        Prescription prescription = prescriptionRepository.findById(request.getPrescriptionId())
                .orElseThrow(() -> new RuntimeException("Prescription not found"));

        Medical medical = medicalRepository.findByMedicalId(request.getMedicalId())
                .orElseThrow(() -> new RuntimeException("Medical store not found"));

        if (currentUser.getRole() == UserRole.PATIENT) {
            if (!prescription.getPatient().getUser().getId().equals(currentUser.getId())) {
                throw new RuntimeException("Not authorized to forward this prescription");
            }
        } else if (currentUser.getRole() == UserRole.DOCTOR) {
            if (prescription.getDoctor() == null || !prescription.getDoctor().getUser().getId().equals(currentUser.getId())) {
                throw new RuntimeException("Not authorized to forward this prescription");
            }
        } else {
            throw new RuntimeException("Only Doctors and Patients can forward prescriptions");
        }

        MedicalOrder order = new MedicalOrder();
        order.setPrescription(prescription);
        order.setPatient(prescription.getPatient());
        order.setMedical(medical);
        order.setStatus(MedicalOrderStatus.REQUESTED);

        return mapToResponse(medicalOrderRepository.save(order));
    }

    // ─── Queries ─────────────────────────────────────────────────────────────

    public List<MedicalOrderResponse> getOrdersForMedical(User currentUser) {
        Medical medical = medicalRepository.findByUser(currentUser)
                .orElseThrow(() -> new RuntimeException("Medical profile not found"));
        return medicalOrderRepository.findByMedicalOrderByCreatedAtDesc(medical).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<MedicalOrderResponse> getOrdersForPatient(User currentUser) {
        Patient patient = patientRepository.findByUserEmail(currentUser.getEmail())
                .orElseThrow(() -> new RuntimeException("Patient profile not found"));
        return medicalOrderRepository.findByPatientOrderByCreatedAtDesc(patient).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ─── Mapper ──────────────────────────────────────────────────────────────

    private MedicalOrderResponse mapToResponse(MedicalOrder order) {
        List<MedicalOrderResponse.OrderItemDetail> itemDetails = new ArrayList<>();
        if (order.getItems() != null) {
            for (OrderItem oi : order.getItems()) {
                itemDetails.add(MedicalOrderResponse.OrderItemDetail.builder()
                        .id(oi.getId())
                        .inventoryItemId(oi.getInventoryItem().getId())
                        .medicineName(oi.getMedicineName())
                        .quantity(oi.getQuantity())
                        .unitPrice(oi.getUnitPrice())
                        .subtotal(oi.getSubtotal())
                        .build());
            }
        }

        return MedicalOrderResponse.builder()
                .id(order.getId())
                .prescriptionId(order.getPrescription() != null ? order.getPrescription().getId() : null)
                .patientId(order.getPatient().getId())
                .medicalId(order.getMedical().getId())
                .storeName(order.getMedical().getStoreName())
                .medicalIdString(order.getMedical().getMedicalId())
                .status(order.getStatus())
                .availableItems(order.getAvailableItems())
                .totalCost(order.getTotalCost())
                .items(itemDetails)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
