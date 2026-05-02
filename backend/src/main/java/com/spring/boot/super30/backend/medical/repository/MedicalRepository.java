package com.spring.boot.super30.backend.medical.repository;

import com.spring.boot.super30.backend.medical.entity.Medical;
import com.spring.boot.super30.backend.shared.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MedicalRepository extends JpaRepository<Medical, UUID> {
    Optional<Medical> findByUser(User user);
    Optional<Medical> findByMedicalId(String medicalId);
}
