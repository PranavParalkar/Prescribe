package com.spring.boot.super30.backend.medical.entity;

import com.spring.boot.super30.backend.shared.entity.User;
import com.spring.boot.super30.backend.shared.enums.MedicalStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "medicals")
@Setter
@Getter
public class Medical {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @Column(unique = true)
    private String medicalId;

    private String storeName;

    private String licenseNumber;

    @Column(name = "license_document_url")
    private String licenseDocumentUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MedicalStatus status = MedicalStatus.PENDING;

    private Double latitude;
    private Double longitude;

    private LocalDateTime createdAt = LocalDateTime.now();

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
