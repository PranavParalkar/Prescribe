package com.spring.boot.super30.backend.medical.service;

import com.spring.boot.super30.backend.medical.dto.MedicalCompleteRequest;
import com.spring.boot.super30.backend.medical.dto.MedicalOrderRequest;
import com.spring.boot.super30.backend.medical.dto.MedicalOrderResponse;
import com.spring.boot.super30.backend.medical.dto.MedicalRespondRequest;
import com.spring.boot.super30.backend.medical.entity.Medical;
import com.spring.boot.super30.backend.medical.entity.MedicalOrder;
import com.spring.boot.super30.backend.medical.repository.MedicalOrderRepository;
import com.spring.boot.super30.backend.medical.repository.MedicalRepository;
import com.spring.boot.super30.backend.patient.entity.Patient;
import com.spring.boot.super30.backend.patient.repository.PatientRepository;
import com.spring.boot.super30.backend.prescription.entity.Prescription;
import com.spring.boot.super30.backend.prescription.repository.PrescriptionRepository;
import com.spring.boot.super30.backend.shared.entity.User;
import com.spring.boot.super30.backend.shared.enums.MedicalOrderStatus;
import com.spring.boot.super30.backend.shared.enums.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MedicalOrderService {

    private final MedicalOrderRepository medicalOrderRepository;
    private final MedicalRepository medicalRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PatientRepository patientRepository;

    @Transactional
    public MedicalOrderResponse forwardPrescription(MedicalOrderRequest request, User currentUser) {
        Prescription prescription = prescriptionRepository.findById(request.getPrescriptionId())
                .orElseThrow(() -> new RuntimeException("Prescription not found"));

        Medical medical = medicalRepository.findById(request.getMedicalId())
                .orElseThrow(() -> new RuntimeException("Medical store not found"));

        // Allow both DOCTOR and PATIENT to forward, but they must be related to prescription
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

    @Transactional
    public MedicalOrderResponse respondToOrder(UUID orderId, MedicalRespondRequest request, User currentUser) {
        MedicalOrder order = medicalOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Medical order not found"));

        Medical medical = medicalRepository.findByUser(currentUser)
                .orElseThrow(() -> new RuntimeException("Medical profile not found"));

        if (!order.getMedical().getId().equals(medical.getId())) {
            throw new RuntimeException("Not authorized to respond to this order");
        }

        if (order.getStatus() != MedicalOrderStatus.REQUESTED) {
            throw new RuntimeException("Order is not in REQUESTED status");
        }

        order.setAvailableItems(request.getAvailableItems());
        order.setTotalCost(request.getTotalCost());
        order.setStatus(MedicalOrderStatus.RESPONDED);

        return mapToResponse(medicalOrderRepository.save(order));
    }

    @Transactional
    public MedicalOrderResponse acceptOrder(UUID orderId, User currentUser) {
        MedicalOrder order = medicalOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Medical order not found"));

        if (!order.getPatient().getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Not authorized to accept this order");
        }

        if (order.getStatus() != MedicalOrderStatus.RESPONDED) {
            throw new RuntimeException("Order is not in RESPONDED status");
        }

        // Simulating payment process here.
        order.setStatus(MedicalOrderStatus.ACCEPTED); // Represents ACCEPTED and PAID

        return mapToResponse(medicalOrderRepository.save(order));
    }

    @Transactional
    public MedicalOrderResponse completeOrder(UUID orderId, MedicalCompleteRequest request, User currentUser) {
        MedicalOrder order = medicalOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Medical order not found"));

        Medical medical = medicalRepository.findByUser(currentUser)
                .orElseThrow(() -> new RuntimeException("Medical profile not found"));

        if (!order.getMedical().getId().equals(medical.getId())) {
            throw new RuntimeException("Not authorized to complete this order");
        }

        if (order.getStatus() != MedicalOrderStatus.ACCEPTED) {
            throw new RuntimeException("Order must be ACCEPTED by patient before completion");
        }

        if (!order.getPatient().getPatientId().equals(request.getPatientId())) {
            throw new RuntimeException("Invalid Patient ID provided");
        }

        order.setStatus(MedicalOrderStatus.COMPLETED);

        return mapToResponse(medicalOrderRepository.save(order));
    }

    private MedicalOrderResponse mapToResponse(MedicalOrder order) {
        MedicalOrderResponse response = new MedicalOrderResponse();
        response.setId(order.getId());
        response.setPrescriptionId(order.getPrescription().getId());
        response.setPatientId(order.getPatient().getId());
        response.setMedicalId(order.getMedical().getId());
        response.setStatus(order.getStatus());
        response.setAvailableItems(order.getAvailableItems());
        response.setTotalCost(order.getTotalCost());
        response.setCreatedAt(order.getCreatedAt());
        response.setUpdatedAt(order.getUpdatedAt());
        return response;
    }
}
