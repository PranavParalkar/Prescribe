package com.spring.boot.super30.backend.shared.entity;

import com.spring.boot.super30.backend.shared.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String email;

    private String passwordHash;

    private String firstName;
    private String lastName;
    private String phone;
    private String address;

    @Column(columnDefinition = "TEXT")
    private String profileImage;

    @Enumerated(EnumType.STRING)
    private UserRole role;

    private Boolean isActive = true;

    private LocalDateTime createdAt = LocalDateTime.now();

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}