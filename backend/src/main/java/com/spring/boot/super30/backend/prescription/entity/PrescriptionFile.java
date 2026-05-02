package com.spring.boot.super30.backend.prescription.entity;

import com.spring.boot.super30.backend.patient.entity.Patient;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "prescription_files")
public class PrescriptionFile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    private Prescription prescription;

    private String fileUrl;

    private String fileType;

    private LocalDateTime uploadedAt = LocalDateTime.now();

}