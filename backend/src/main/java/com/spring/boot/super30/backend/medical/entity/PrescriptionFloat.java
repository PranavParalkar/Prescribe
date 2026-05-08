package com.spring.boot.super30.backend.medical.entity;

import com.spring.boot.super30.backend.patient.entity.Patient;
import com.spring.boot.super30.backend.prescription.entity.Prescription;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "prescription_floats")
@Getter
@Setter
public class PrescriptionFloat {

    public enum FloatStatus { OPEN, CLOSED, EXPIRED }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = true)
    @JoinColumn(name = "prescription_id")
    private Prescription prescription;

    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    private Double radiusKm = 3.0;

    @Column(columnDefinition = "TEXT")
    private String medicineList;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FloatStatus status = FloatStatus.OPEN;

    @OneToMany(mappedBy = "prescriptionFloat", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<FloatQuote> quotes = new ArrayList<>();

    private LocalDateTime createdAt = LocalDateTime.now();
}
