package com.spring.boot.super30.backend.medical.repository;

import com.spring.boot.super30.backend.medical.entity.FloatQuote;
import com.spring.boot.super30.backend.medical.entity.Medical;
import com.spring.boot.super30.backend.medical.entity.PrescriptionFloat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FloatQuoteRepository extends JpaRepository<FloatQuote, UUID> {
    Optional<FloatQuote> findByPrescriptionFloatAndMedical(PrescriptionFloat prescriptionFloat, Medical medical);
}
