package com.spring.boot.super30.backend.doctor.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "deleted_doctors")
@Setter
@Getter
public class DeletedDoctor {

    @Id
    private String doctorId; 

    private String firstName;
    private String lastName;
    private String email;
    private String specialization;

    private LocalDateTime deletedAt = LocalDateTime.now();
}
