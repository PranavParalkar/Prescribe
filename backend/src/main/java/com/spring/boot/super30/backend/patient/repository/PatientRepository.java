package com.spring.boot.super30.backend.patient.repository;

import com.spring.boot.super30.backend.patient.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PatientRepository extends JpaRepository<Patient, UUID> {

    Optional<Patient> findByPatientId(String patientId);
    Optional<Patient> findByUserEmail(String email);

}