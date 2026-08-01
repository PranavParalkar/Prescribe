package com.spring.boot.super30.backend.prescription.entity;

import com.spring.boot.super30.backend.patient.entity.Patient;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "medication_reminders", indexes = {
        @Index(columnList = "scheduled_time"),
        @Index(columnList = "sent")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicationReminder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(nullable = false)
    private Patient patient;

    private String medicineName;
    private String dosage;

    @Column(name = "scheduled_time", nullable = false)
    private LocalDateTime scheduledTime;

    @Column(nullable = false)
    private boolean sent = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
