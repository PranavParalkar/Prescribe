package com.spring.boot.super30.backend.medical.entity;

import com.spring.boot.super30.backend.patient.entity.Patient;
import com.spring.boot.super30.backend.prescription.entity.Prescription;
import com.spring.boot.super30.backend.shared.enums.MedicalOrderStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "medical_orders")
@Getter
@Setter
public class MedicalOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(nullable = false)
    private Prescription prescription;

    @ManyToOne(optional = false)
    @JoinColumn(nullable = false)
    private Patient patient;

    @ManyToOne(optional = false)
    @JoinColumn(nullable = false)
    private Medical medical;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MedicalOrderStatus status = MedicalOrderStatus.REQUESTED;

    @Column(columnDefinition = "TEXT")
    private String availableItems;

    private Double totalCost;

    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;

    private LocalDateTime createdAt = LocalDateTime.now();

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
