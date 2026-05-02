package com.spring.boot.super30.backend.prescription.entity;

import com.spring.boot.super30.backend.doctor.entity.Doctor;
import com.spring.boot.super30.backend.doctor.entity.DeletedDoctor;
import com.spring.boot.super30.backend.patient.entity.Patient;
import com.spring.boot.super30.backend.shared.enums.PrescriptionStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.UpdateTimestamp;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "prescriptions")
@Getter
@Setter
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(nullable = false)
    private Patient patient;

    @ManyToOne(optional = true)
    @JoinColumn(nullable = true)
    private Doctor doctor;

    @ManyToOne(optional = true)
    @JoinColumn(name = "deleted_doctor_id", nullable = true)
    private DeletedDoctor deletedDoctor;

    @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.PERSIST)
    @JoinColumn(name = "current_version_id", unique = false)
    private PrescriptionVersion currentVersion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PrescriptionStatus status = PrescriptionStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "revoke_reason")
    private com.spring.boot.super30.backend.shared.enums.RevokeReason revokeReason;

    private LocalDateTime createdAt = LocalDateTime.now();

}