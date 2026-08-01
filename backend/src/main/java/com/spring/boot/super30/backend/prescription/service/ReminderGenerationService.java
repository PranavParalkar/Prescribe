package com.spring.boot.super30.backend.prescription.service;

import com.spring.boot.super30.backend.patient.entity.Patient;
import com.spring.boot.super30.backend.prescription.entity.MedicationReminder;
import com.spring.boot.super30.backend.prescription.entity.PrescriptionMedicine;
import com.spring.boot.super30.backend.prescription.repository.MedicationReminderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReminderGenerationService {

    private final MedicationReminderRepository medicationReminderRepository;

    @Async
    public void generateRemindersForMedicines(Patient patient, List<PrescriptionMedicine> medicines) {
        if (medicines == null || medicines.isEmpty()) {
            return;
        }

        List<MedicationReminder> remindersToSave = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (PrescriptionMedicine medicine : medicines) {
            int durationDays = parseDuration(medicine.getDuration());
            List<LocalTime> timesOfDay = parseFrequency(medicine.getFrequency());

            for (int i = 0; i < durationDays; i++) {
                LocalDate date = today.plusDays(i);
                for (LocalTime time : timesOfDay) {
                    LocalDateTime scheduledTime = LocalDateTime.of(date, time);
                    
                    // Skip if the time has already passed today
                    if (scheduledTime.isBefore(LocalDateTime.now())) {
                        continue;
                    }

                    MedicationReminder reminder = MedicationReminder.builder()
                            .patient(patient)
                            .medicineName(medicine.getMedicineName())
                            .dosage(medicine.getDosage())
                            .scheduledTime(scheduledTime)
                            .sent(false)
                            .build();
                    remindersToSave.add(reminder);
                }
            }
        }

        if (!remindersToSave.isEmpty()) {
            medicationReminderRepository.saveAll(remindersToSave);
            log.info("Generated {} medication reminders for patient ID: {}", remindersToSave.size(), patient.getPatientId());
        }
    }

    private int parseDuration(String durationStr) {
        if (durationStr == null || durationStr.isBlank()) {
            return 3; // default 3 days
        }
        String lower = durationStr.toLowerCase().trim();
        try {
            String numberPart = lower.replaceAll("[^0-9]", "");
            if (!numberPart.isEmpty()) {
                return Integer.parseInt(numberPart);
            }
        } catch (Exception e) {
            log.warn("Failed to parse duration: {}", durationStr);
        }
        return 3;
    }

    private List<LocalTime> parseFrequency(String frequencyStr) {
        List<LocalTime> times = new ArrayList<>();
        if (frequencyStr == null || frequencyStr.isBlank()) {
            times.add(LocalTime.of(9, 0)); // default morning
            return times;
        }
        String lower = frequencyStr.toLowerCase().trim();

        if (lower.contains("1-0-1")) {
            times.add(LocalTime.of(8, 0));
            times.add(LocalTime.of(20, 0));
        } else if (lower.contains("1-1-1")) {
            times.add(LocalTime.of(8, 0));
            times.add(LocalTime.of(13, 0));
            times.add(LocalTime.of(20, 0));
        } else if (lower.contains("0-0-1")) {
            times.add(LocalTime.of(20, 0));
        } else if (lower.contains("1-0-0")) {
            times.add(LocalTime.of(8, 0));
        } else if (lower.contains("twice")) {
            times.add(LocalTime.of(8, 0));
            times.add(LocalTime.of(20, 0));
        } else if (lower.contains("thrice") || lower.contains("3 times")) {
            times.add(LocalTime.of(8, 0));
            times.add(LocalTime.of(13, 0));
            times.add(LocalTime.of(20, 0));
        } else if (lower.contains("night")) {
            times.add(LocalTime.of(20, 0));
        } else {
            times.add(LocalTime.of(9, 0)); // default fallback
        }
        return times;
    }
}
