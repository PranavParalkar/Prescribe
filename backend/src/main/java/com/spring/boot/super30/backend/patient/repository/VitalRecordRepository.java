package com.spring.boot.super30.backend.patient.repository;

import com.spring.boot.super30.backend.patient.entity.Patient;
import com.spring.boot.super30.backend.patient.entity.VitalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface VitalRecordRepository extends JpaRepository<VitalRecord, UUID> {

    List<VitalRecord> findByPatientOrderByRecordedDateDesc(Patient patient);

    List<VitalRecord> findByPatientAndRecordedDateBetweenOrderByRecordedDateAsc(
            Patient patient, LocalDate start, LocalDate end);

    List<VitalRecord> findByPatientOrderByRecordedDateAsc(Patient patient);
}
