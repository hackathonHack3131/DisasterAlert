package com.disaster.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Service
public class TwilioSmsService {

    private static final Logger log = LoggerFactory.getLogger(TwilioSmsService.class);

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.twilio.account-sid:}")
    private String accountSid;

    @Value("${app.twilio.auth-token:}")
    private String authToken;

    @Value("${app.twilio.phone-number:}")
    private String fromNumber;

    @Async
    public void sendAlert(String toPhone, String message) {
        if (accountSid == null || accountSid.isBlank() || authToken == null || authToken.isBlank()) {
            log.warn("Twilio not configured (need TWILIO_ACCOUNT_SID) — SMS skipped for {}", toPhone);
            return;
        }
        if (fromNumber == null || fromNumber.isBlank()) {
            log.warn("TWILIO_PHONE_NUMBER not set — SMS skipped");
            return;
        }
        try {
            String url = String.format(
                    "https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", accountSid);
            String auth = Base64.getEncoder().encodeToString(
                    (accountSid + ":" + authToken).getBytes(StandardCharsets.UTF_8));
            restTemplate.postForObject(url, Map.of(
                    "To", toPhone,
                    "From", fromNumber,
                    "Body", message
            ), String.class, Map.of("Authorization", "Basic " + auth));
            log.info("SMS sent to {}", toPhone);
        } catch (Exception e) {
            log.error("Twilio SMS failed: {}", e.getMessage());
        }
    }

    public boolean isConfigured() {
        return accountSid != null && !accountSid.isBlank()
                && authToken != null && !authToken.isBlank()
                && fromNumber != null && !fromNumber.isBlank();
    }
}
