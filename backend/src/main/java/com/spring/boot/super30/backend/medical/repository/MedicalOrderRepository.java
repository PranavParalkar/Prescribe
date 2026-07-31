package com.spring.boot.super30.backend.medical.repository;

import com.spring.boot.super30.backend.medical.entity.Medical;
import com.spring.boot.super30.backend.medical.entity.MedicalOrder;
import com.spring.boot.super30.backend.patient.entity.Patient;
import com.spring.boot.super30.backend.shared.enums.MedicalOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface MedicalOrderRepository extends JpaRepository<MedicalOrder, UUID> {
    List<MedicalOrder> findByMedicalOrderByCreatedAtDesc(Medical medical);
    List<MedicalOrder> findByPatientOrderByCreatedAtDesc(Patient patient);

    @Query("SELECT o FROM MedicalOrder o WHERE o.medical = :medical AND o.status = :status ORDER BY o.createdAt ASC")
    List<MedicalOrder> findByMedicalAndStatus(@Param("medical") Medical medical, @Param("status") MedicalOrderStatus status);

    @Query("SELECT o FROM MedicalOrder o WHERE o.medical = :medical AND o.status = :status AND o.createdAt >= :since ORDER BY o.createdAt ASC")
    List<MedicalOrder> findByMedicalAndStatusSince(
            @Param("medical") Medical medical,
            @Param("status") MedicalOrderStatus status,
            @Param("since") LocalDateTime since);
}
