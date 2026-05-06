package com.spring.boot.super30.backend.medical.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "inventory_items", indexes = {
    @Index(name = "idx_inv_medicine_name", columnList = "medicineName"),
    @Index(name = "idx_inv_medical_id", columnList = "medical_id")
})
@Getter
@Setter
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "medical_id", nullable = false)
    private Medical medical;

    @Column(nullable = false)
    private String medicineName;

    private String genericName;

    private String manufacturer;

    private String batchNumber;

    @Column(nullable = false)
    private Integer quantity = 0;

    @Column(nullable = false)
    private Double price = 0.0;

    private LocalDate expiryDate;

    private String category;

    @Column(nullable = false)
    private Integer lowStockThreshold = 10;

    @Column(nullable = false)
    private Boolean active = true;

    private LocalDateTime createdAt = LocalDateTime.now();

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
