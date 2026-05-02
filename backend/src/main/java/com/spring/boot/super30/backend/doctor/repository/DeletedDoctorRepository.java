package com.spring.boot.super30.backend.doctor.repository;

import com.spring.boot.super30.backend.doctor.entity.DeletedDoctor;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeletedDoctorRepository extends JpaRepository<DeletedDoctor, String> {
}
