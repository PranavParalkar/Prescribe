package com.spring.boot.super30.backend.notification.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID userId;

    private String message;

    private Boolean isRead = false;

    private LocalDateTime createdAt = LocalDateTime.now();
}