package com.spring.boot.super30.backend.prescription.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "prescription_versions", indexes = {
        @Index(columnList = "prescription_id")
}, uniqueConstraints = {
        @UniqueConstraint(columnNames = {"prescription_id", "version_number"})
})
@Getter
@Setter
public class PrescriptionVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(nullable = false)
    @JsonIgnore
    private Prescription prescription;

    private String diagnosis;

    private String notes;

    @OneToMany(mappedBy = "prescriptionVersion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PrescriptionMedicine> medicines;

    private Integer versionNumber;

    private LocalDateTime createdAt = LocalDateTime.now();
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}