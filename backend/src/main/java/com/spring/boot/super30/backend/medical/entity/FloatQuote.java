package com.spring.boot.super30.backend.medical.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "float_quotes")
@Getter
@Setter
public class FloatQuote {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "float_id", nullable = false)
    private PrescriptionFloat prescriptionFloat;

    @ManyToOne(optional = false)
    @JoinColumn(name = "medical_id", nullable = false)
    private Medical medical;

    @Column(columnDefinition = "TEXT")
    private String availableItems;

    @Column(nullable = false)
    private Double totalCost;

    private LocalDateTime createdAt = LocalDateTime.now();
}
