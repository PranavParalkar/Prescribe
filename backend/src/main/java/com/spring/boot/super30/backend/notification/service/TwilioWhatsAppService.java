package com.spring.boot.super30.backend.notification.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class TwilioWhatsAppService {

    @Value("${twilio.account-sid:}")
    private String accountSid;

    @Value("${twilio.auth-token:}")
    private String authToken;

    @Value("${twilio.whatsapp-number:}")
    private String twilioWhatsappNumber;

    private boolean isConfigured = false;

    @PostConstruct
    public void init() {
        if (accountSid != null && !accountSid.isBlank() && 
            authToken != null && !authToken.isBlank() && 
            twilioWhatsappNumber != null && !twilioWhatsappNumber.isBlank()) {
            // Twilio.init is typically called once per app, but doing it again or checking is fine.
            // Since TwilioSmsService might also initialize it, this is safe if both use same credentials.
            try {
                Twilio.init(accountSid, authToken);
                isConfigured = true;
                log.info("Twilio WhatsApp Service initialized successfully with number: {}", twilioWhatsappNumber);
            } catch (Exception e) {
                log.warn("Twilio WhatsApp initialization issue (might be already initialized): {}", e.getMessage());
                isConfigured = true; // Assume already initialized
            }
        } else {
            log.warn("Twilio WhatsApp credentials not fully configured. WhatsApp notifications will only be logged.");
        }
    }

    public void sendWhatsApp(String toPhoneNumber, String messageBody) {
        if (!isConfigured) {
            log.info("Mock Twilio WhatsApp -> To: {}, Message: '{}'", toPhoneNumber, messageBody);
            return;
        }
        
        try {
            // WhatsApp requires the 'whatsapp:' prefix for both from and to numbers
            String to = toPhoneNumber.startsWith("whatsapp:") ? toPhoneNumber : "whatsapp:" + toPhoneNumber;
            String from = twilioWhatsappNumber.startsWith("whatsapp:") ? twilioWhatsappNumber : "whatsapp:" + twilioWhatsappNumber;

            Message message = Message.creator(
                    new PhoneNumber(to),
                    new PhoneNumber(from),
                    messageBody
            ).create();
            log.info("WhatsApp sent successfully via Twilio. SID: {}", message.getSid());
        } catch (Exception e) {
            log.error("Failed to send WhatsApp via Twilio to {}: {}", toPhoneNumber, e.getMessage());
        }
    }
}
