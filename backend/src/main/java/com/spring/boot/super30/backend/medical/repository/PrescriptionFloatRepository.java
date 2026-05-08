package com.spring.boot.super30.backend.medical.repository;

import com.spring.boot.super30.backend.medical.entity.PrescriptionFloat;
import com.spring.boot.super30.backend.patient.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PrescriptionFloatRepository extends JpaRepository<PrescriptionFloat, UUID> {

    List<PrescriptionFloat> findByPatientOrderByCreatedAtDesc(Patient patient);

    @Query("SELECT f FROM PrescriptionFloat f WHERE f.status = 'OPEN'")
    List<PrescriptionFloat> findAllOpen();
}
