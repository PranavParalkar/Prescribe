package com.spring.boot.super30.backend.prescription.entity;



import com.spring.boot.super30.backend.doctor.entity.Doctor;
import com.spring.boot.super30.backend.patient.entity.Patient;
import com.spring.boot.super30.backend.shared.enums.AccessStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "prescription_access")
public class PrescriptionAccess {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(nullable = false)
    private Prescription prescription;

    @ManyToOne
    @JoinColumn(nullable = false)
    private Doctor doctor;

    @ManyToOne
    private Patient grantedBy;

    private LocalDateTime grantedAt = LocalDateTime.now();

    private LocalDateTime expiresAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccessStatus status = AccessStatus.ACTIVE;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}