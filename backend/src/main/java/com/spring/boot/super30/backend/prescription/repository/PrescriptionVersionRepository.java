package com.spring.boot.super30.backend.prescription.repository;

import com.spring.boot.super30.backend.prescription.entity.PrescriptionVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PrescriptionVersionRepository extends JpaRepository<PrescriptionVersion, UUID> {
}

