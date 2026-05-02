package com.spring.boot.super30.backend.prescription.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Getter
@Setter
@Table(name = "prescription_medicines")
public class PrescriptionMedicine {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * NOTE: Keep this association nullable in DDL auto-update mode.
     * Some existing databases may not have the FK column yet; making it nullable
     * allows Hibernate to add the column without failing on existing rows.
     * The service layer always sets this value for new inserts.
     */
    @ManyToOne(optional = true)
    @JoinColumn(name = "prescription_version_id", nullable = true)
    @JsonIgnore
    private PrescriptionVersion prescriptionVersion;

    private String medicineName;

    private String dosage;

    private String frequency;

    private String duration;

    private String instructions;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
