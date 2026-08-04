package com.spring.boot.super30.backend.prescription.job;

import com.spring.boot.super30.backend.notification.service.TwilioWhatsAppService;
import com.spring.boot.super30.backend.notification.entity.Notification;
import com.spring.boot.super30.backend.notification.repository.NotificationRepository;
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
    private final TwilioWhatsAppService whatsappService;
    private final NotificationRepository notificationRepository;

    @Scheduled(fixedRate = 60000) // Runs every minute
    public void processPendingReminders() {
        LocalDateTime now = LocalDateTime.now();
        List<MedicationReminder> pendingReminders = reminderRepository.findByScheduledTimeBeforeAndSentFalse(now);

        if (!pendingReminders.isEmpty()) {
            log.info("Found {} pending medication reminders to send.", pendingReminders.size());
        }

        for (MedicationReminder reminder : pendingReminders) {
            String phoneNumber = reminder.getPatient().getUser().getPhone();
            String message = String.format("Prescribe Reminder: Time to take your %s %s.", 
                    reminder.getMedicineName(), reminder.getDosage() != null ? reminder.getDosage() : "");
            
            // In-app Notification
            Notification notification = Notification.builder()
                .userId(reminder.getPatient().getUser().getId())
                .title("Medication Reminder")
                .message(message)
                .type("MEDICATION_REMINDER")
                .build();
            notificationRepository.save(notification);

            if (phoneNumber != null && !phoneNumber.isBlank()) {
                boolean smsEnabled = Boolean.TRUE.equals(reminder.getPatient().getUser().getSmsNotificationsEnabled());
                boolean whatsappEnabled = Boolean.TRUE.equals(reminder.getPatient().getUser().getWhatsappNotificationsEnabled());

                if (smsEnabled) {
                    smsService.sendSms(phoneNumber, message);
                }
                if (whatsappEnabled) {
                    whatsappService.sendWhatsApp(phoneNumber, message);
                }
                
                if (!smsEnabled && !whatsappEnabled) {
                     log.debug("Patient {} has disabled both SMS and WhatsApp notifications.", reminder.getPatient().getPatientId());
                }
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
