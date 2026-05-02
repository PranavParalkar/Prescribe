package com.spring.boot.super30.backend.document.entity;

import com.spring.boot.super30.backend.patient.entity.Patient;
import com.spring.boot.super30.backend.shared.enums.MedicalCategory;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "patient_documents")
@Getter
@Setter
public class PatientDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MedicalCategory category;

    @Column(nullable = false)
    private String fileName;

    private Long fileSize;

    private String contentType;

    @Column(nullable = false)
    private String s3Key;

    @Column(nullable = false)
    private String s3StorageClass = "STANDARD";

    private String restoreStatus = "NONE"; // NONE, IN_PROGRESS, RESTORED

    private String description;

    private LocalDate documentDate;

    @CreationTimestamp
    private LocalDateTime uploadedAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
