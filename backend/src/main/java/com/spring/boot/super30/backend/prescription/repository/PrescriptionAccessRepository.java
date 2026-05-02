package com.spring.boot.super30.backend.prescription.repository;

import com.spring.boot.super30.backend.doctor.entity.Doctor;
import com.spring.boot.super30.backend.prescription.entity.Prescription;
import com.spring.boot.super30.backend.prescription.entity.PrescriptionAccess;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PrescriptionAccessRepository
        extends JpaRepository<PrescriptionAccess, UUID> {

    Optional<PrescriptionAccess> findByPrescriptionAndDoctor(
            Prescription prescription,
            Doctor doctor
    );

}
