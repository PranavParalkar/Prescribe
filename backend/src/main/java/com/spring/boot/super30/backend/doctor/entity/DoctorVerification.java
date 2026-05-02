package com.spring.boot.super30.backend.doctor.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;
import org.hibernate.annotations.UpdateTimestamp;
import com.spring.boot.super30.backend.shared.entity.User;@Entity
@Table(name = "doctor_verifications")
public class DoctorVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(nullable = false)
    private Doctor doctor;

    @Column(nullable = false)
    private String licenseNumber;

    @Column(nullable = false)
    private String verificationStatus;

    @ManyToOne
    @JoinColumn(nullable = false)
    private User verifiedBy;

    private LocalDateTime verifiedAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}