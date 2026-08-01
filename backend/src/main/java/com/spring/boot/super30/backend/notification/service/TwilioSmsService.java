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
public class TwilioSmsService {

    @Value("${twilio.account-sid:}")
    private String accountSid;

    @Value("${twilio.auth-token:}")
    private String authToken;

    @Value("${twilio.phone-number:}")
    private String twilioPhoneNumber;

    private boolean isConfigured = false;

    @PostConstruct
    public void init() {
        if (accountSid != null && !accountSid.isBlank() && 
            authToken != null && !authToken.isBlank() && 
            twilioPhoneNumber != null && !twilioPhoneNumber.isBlank()) {
            Twilio.init(accountSid, authToken);
            isConfigured = true;
            log.info("Twilio SMS Service initialized successfully.");
        } else {
            log.warn("Twilio credentials not fully configured. SMS notifications will only be logged.");
        }
    }

    public void sendSms(String toPhoneNumber, String messageBody) {
        if (!isConfigured) {
            log.info("Mock Twilio SMS -> To: {}, Message: '{}'", toPhoneNumber, messageBody);
            return;
        }
        
        try {
            Message message = Message.creator(
                    new PhoneNumber(toPhoneNumber),
                    new PhoneNumber(twilioPhoneNumber),
                    messageBody
            ).create();
            log.info("SMS sent successfully via Twilio. SID: {}", message.getSid());
        } catch (Exception e) {
            log.error("Failed to send SMS via Twilio to {}: {}", toPhoneNumber, e.getMessage());
        }
    }
}
