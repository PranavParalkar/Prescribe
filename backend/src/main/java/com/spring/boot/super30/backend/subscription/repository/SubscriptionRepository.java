package com.spring.boot.super30.backend.subscription.repository;

import com.spring.boot.super30.backend.patient.entity.Patient;
import com.spring.boot.super30.backend.shared.enums.SubscriptionStatus;
import com.spring.boot.super30.backend.subscription.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {

    Optional<Subscription> findByPatientAndStatus(Patient patient, SubscriptionStatus status);

    Optional<Subscription> findTopByPatientOrderByCreatedAtDesc(Patient patient);

    Optional<Subscription> findByRazorpayOrderId(String razorpayOrderId);
}
