package com.spring.boot.super30.backend.prescription.repository;

import com.spring.boot.super30.backend.prescription.entity.MedicationReminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface MedicationReminderRepository extends JpaRepository<MedicationReminder, UUID> {
    
    List<MedicationReminder> findByScheduledTimeBeforeAndSentFalse(LocalDateTime time);
}
