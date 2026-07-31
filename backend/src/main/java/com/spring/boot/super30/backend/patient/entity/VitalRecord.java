package com.spring.boot.super30.backend.patient.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "vital_records", indexes = {
        @Index(columnList = "patient_id, recorded_date")
})
@Getter
@Setter
public class VitalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    /** Systolic blood pressure (mmHg), e.g. 120 */
    private Integer systolicBp;

    /** Diastolic blood pressure (mmHg), e.g. 80 */
    private Integer diastolicBp;

    /** Weight in kg, e.g. 72.5 */
    private Double weightKg;

    /** Heart rate (bpm) */
    private Integer heartRate;

    /** Blood sugar level (mg/dL) */
    private Double bloodSugar;

    /** Body temperature (°C) */
    private Double temperature;

    /** Optional notes, e.g. "Taken after exercise" */
    @Column(columnDefinition = "TEXT")
    private String notes;

    /** The date the vitals were recorded (user-specified, defaults to today) */
    @Column(name = "recorded_date", nullable = false)
    private LocalDate recordedDate;

    private LocalDateTime createdAt = LocalDateTime.now();

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
