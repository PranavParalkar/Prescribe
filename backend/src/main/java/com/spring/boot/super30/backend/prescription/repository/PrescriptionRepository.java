package com.spring.boot.super30.backend.prescription.repository;


import com.spring.boot.super30.backend.doctor.entity.Doctor;
import com.spring.boot.super30.backend.patient.entity.Patient;
import com.spring.boot.super30.backend.prescription.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PrescriptionRepository extends JpaRepository<Prescription, UUID> {

    List<Prescription> findByPatient(Patient patient);

    List<Prescription> findByDoctor(Doctor doctor);

    long countByPatient(Patient patient);

}


