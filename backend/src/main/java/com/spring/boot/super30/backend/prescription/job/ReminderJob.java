package com.spring.boot.super30.backend.prescription.job;

import com.spring.boot.super30.backend.notification.service.TwilioSmsService;
import com.spring.boot.super30.backend.prescription.entity.MedicationReminder;
import com.spring.boot.super30.backend.prescription.repository.MedicationReminderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReminderJob {

    private final MedicationReminderRepository reminderRepository;
    private final TwilioSmsService smsService;

    @Scheduled(fixedRate = 60000) // Runs every minute
    public void processPendingReminders() {
        LocalDateTime now = LocalDateTime.now();
        List<MedicationReminder> pendingReminders = reminderRepository.findByScheduledTimeBeforeAndSentFalse(now);

        if (!pendingReminders.isEmpty()) {
            log.info("Found {} pending medication reminders to send.", pendingReminders.size());
        }

        for (MedicationReminder reminder : pendingReminders) {
            String phoneNumber = reminder.getPatient().getUser().getPhone();
            if (phoneNumber != null && !phoneNumber.isBlank()) {
                String message = String.format("Prescribe Reminder: Time to take your %s %s.", 
                        reminder.getMedicineName(), reminder.getDosage() != null ? reminder.getDosage() : "");
                smsService.sendSms(phoneNumber, message);
            } else {
                log.warn("Patient {} has no phone number. Cannot send reminder for {}.", 
                        reminder.getPatient().getPatientId(), reminder.getMedicineName());
            }

            reminder.setSent(true);
        }

        if (!pendingReminders.isEmpty()) {
            reminderRepository.saveAll(pendingReminders);
        }
    }
}
