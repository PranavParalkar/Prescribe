package com.spring.boot.super30.backend.prescription.controller;

import com.spring.boot.super30.backend.prescription.entity.MedicationReminder;
import com.spring.boot.super30.backend.prescription.repository.MedicationReminderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reminders")
@RequiredArgsConstructor
@Slf4j
public class ReminderController {

    private final MedicationReminderRepository medicationReminderRepository;

    @GetMapping("/patient/{patientId}/upcoming")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<List<MedicationReminder>> getUpcomingReminders(@PathVariable String patientId) {
        log.info("Fetching upcoming reminders for patient ID: {}", patientId);
        return ResponseEntity.ok(medicationReminderRepository.findByPatient_PatientIdAndSentFalseOrderByScheduledTimeAsc(patientId));
    }

    @GetMapping("/patient/{patientId}/history")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<List<MedicationReminder>> getReminderHistory(@PathVariable String patientId) {
        log.info("Fetching reminder history for patient ID: {}", patientId);
        return ResponseEntity.ok(medicationReminderRepository.findByPatient_PatientIdOrderByScheduledTimeDesc(patientId));
    }

    @GetMapping("/patient/{patientId}/today")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<List<MedicationReminder>> getTodayReminders(@PathVariable String patientId) {
        log.info("Fetching today's reminders for patient ID: {}", patientId);
        LocalDate today = LocalDate.now();
        List<MedicationReminder> todayReminders = medicationReminderRepository.findByPatient_PatientIdOrderByScheduledTimeDesc(patientId)
                .stream()
                .filter(r -> r.getScheduledTime().toLocalDate().equals(today))
                .sorted((a, b) -> a.getScheduledTime().compareTo(b.getScheduledTime()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(todayReminders);
    }
}
