package com.spring.boot.super30.backend.doctor.repository;


import com.spring.boot.super30.backend.doctor.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DoctorRepository extends JpaRepository<Doctor, UUID> {

    Optional<Doctor> findByDoctorId(String doctorId);
    Optional<Doctor> findByUserEmail(String email);

}