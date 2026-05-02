package com.spring.boot.super30.backend.medical.repository;

import com.spring.boot.super30.backend.medical.entity.Medical;
import com.spring.boot.super30.backend.medical.entity.MedicalOrder;
import com.spring.boot.super30.backend.patient.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MedicalOrderRepository extends JpaRepository<MedicalOrder, UUID> {
    List<MedicalOrder> findByMedicalOrderByCreatedAtDesc(Medical medical);
    List<MedicalOrder> findByPatientOrderByCreatedAtDesc(Patient patient);
}
