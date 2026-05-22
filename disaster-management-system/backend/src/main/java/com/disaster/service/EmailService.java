package com.disaster.service;

import com.disaster.model.DisasterEvent;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.mail.from:${spring.mail.username:}}")
    private String fromEmail;

    @Value("${app.mail.from-name:Smart Disaster Alert}")
    private String fromName;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String mailHost;

    @Value("${app.mail.provider:auto}")
    private String mailProvider;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * OTP must be synchronous so registration fails loudly if email cannot be sent.
     */
    public void sendOtpEmail(String to, String otp) throws EmailDeliveryException {
        String subject = "Disaster Platform Email Verification";
        String html = """
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#050505;color:#fff;border-radius:12px;">
                  <h2 style="color:#0050FF;margin:0 0 16px;">Email Verification</h2>
                  <p style="color:rgba(255,255,255,0.7);">Your one-time password for Smart Disaster Alert Platform:</p>
                  <p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#FF6A00;text-align:center;margin:24px 0;">%s</p>
                  <p style="color:rgba(255,255,255,0.6);font-size:13px;">This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
                  <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:24px 0;">
                  <p style="color:rgba(255,255,255,0.4);font-size:12px;">Smart Disaster Alert &amp; Resource Coordination System</p>
                </div>
                """.formatted(otp);

        String text = "Your OTP code is: " + otp + "\n\nThis code expires in 5 minutes.\n\n— Smart Disaster Alert Platform";

        deliverSync(to, subject, text, html);
        log.info("OTP email delivered to {}", to);
    }

    @Async
    public void sendDisasterAlert(String to, DisasterEvent event, String nearestShelter) {
        String subject = "EMERGENCY: " + event.getDisasterType() + " Alert";
        String text = String.format(
                "EMERGENCY ALERT%n%nType: %s%nSeverity: %d/10%nLocation: %s%nMessage: %s%n%nNearest shelter: %s%n%nFollow local emergency instructions immediately.",
                event.getDisasterType(), event.getSeverity(), event.getLocation(),
                event.getMessage(), nearestShelter != null ? nearestShelter : "Check dashboard");
        try {
            deliverSync(to, subject, text, null);
        } catch (EmailDeliveryException e) {
            log.error("Disaster alert email failed for {}: {}", to, e.getMessage());
        }
    }

    private void deliverSync(String to, String subject, String text, String html) throws EmailDeliveryException {
        if (fromEmail == null || fromEmail.isBlank()) {
            throw new EmailDeliveryException("Mail sender address (MAIL_FROM) is not configured");
        }

        Exception lastError = null;

        // Gmail app password is most reliable for @gmail.com recipients/senders
        if (hasGmailCredentials() && (useGmail() || "auto".equalsIgnoreCase(mailProvider))) {
            try {
                sendViaSmtp(to, subject, text, html, "smtp.gmail.com", fromEmail, getGmailPassword());
                return;
            } catch (Exception e) {
                lastError = e;
                log.warn("Gmail SMTP failed: {}", e.getMessage());
            }
        }

        if (useBrevoApi()) {
            try {
                sendViaBrevoApi(to, subject, text, html);
                return;
            } catch (Exception e) {
                lastError = e;
                log.warn("Brevo API failed: {}", e.getMessage());
            }
        }

        try {
            sendViaSmtp(to, subject, text, html, mailHost, resolveSmtpUsername(), mailPassword);
        } catch (Exception e) {
            throw new EmailDeliveryException(
                    "Could not send email. In Brevo: verify sender " + fromEmail
                            + ". Or use Gmail app password. Details: "
                            + (lastError != null ? lastError.getMessage() : e.getMessage()), e);
        }
    }

    private void sendViaBrevoApi(String to, String subject, String text, String html) {
        String apiKey = (brevoApiKey != null && !brevoApiKey.isBlank()) ? brevoApiKey : mailPassword;
        if (apiKey == null || !apiKey.startsWith("xkeysib-")) {
            throw new IllegalStateException("Brevo API key (xkeysib-...) not configured");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", apiKey);

        Map<String, Object> body = Map.of(
                "sender", Map.of("name", fromName, "email", fromEmail),
                "to", List.of(Map.of("email", to)),
                "subject", subject,
                "textContent", text,
                "htmlContent", html != null ? html : "<p>" + text.replace("\n", "<br>") + "</p>"
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        restTemplate.postForEntity("https://api.brevo.com/v3/smtp/email", request, String.class);
        log.info("Email sent via Brevo API to {}", to);
    }

    private void sendViaSmtp(String to, String subject, String text, String html,
                             String host, String username, String password) throws Exception {
        if (password == null || password.isBlank()) {
            throw new IllegalStateException("SMTP password not configured for " + host);
        }

        JavaMailSender sender = createMailSender(host, username, password);
        MimeMessage message = sender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(new InternetAddress(fromEmail, fromName));
        helper.setTo(to);
        helper.setSubject(subject);
        if (html != null) {
            helper.setText(text, html);
        } else {
            helper.setText(text, false);
        }
        sender.send(message);
        log.info("Email sent via SMTP ({}) to {}", host, to);
    }

    private JavaMailSender createMailSender(String host, String username, String password) {
        org.springframework.mail.javamail.JavaMailSenderImpl impl = new org.springframework.mail.javamail.JavaMailSenderImpl();
        impl.setHost(host);
        impl.setPort(587);
        impl.setUsername(username);
        impl.setPassword(password);
        java.util.Properties props = impl.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.ssl.trust", host);
        props.put("mail.debug", "false");
        return impl;
    }

    private boolean useBrevoApi() {
        String key = (brevoApiKey != null && !brevoApiKey.isBlank()) ? brevoApiKey : mailPassword;
        return "brevo-api".equalsIgnoreCase(mailProvider)
                || ("auto".equalsIgnoreCase(mailProvider) && key != null && key.startsWith("xkeysib-"));
    }

    private boolean useGmail() {
        return "gmail".equalsIgnoreCase(mailProvider);
    }

    @Value("${GMAIL_APP_PASSWORD:}")
    private String gmailAppPassword;

    @Value("${BREVO_API_KEY:}")
    private String brevoApiKey;

    private boolean hasGmailCredentials() {
        return gmailAppPassword != null && !gmailAppPassword.isBlank();
    }

    private String getGmailPassword() {
        return gmailAppPassword;
    }

    private String resolveSmtpUsername() {
        return fromEmail;
    }

    public boolean isConfigured() {
        return fromEmail != null && !fromEmail.isBlank();
    }

    public static class EmailDeliveryException extends Exception {
        public EmailDeliveryException(String message) {
            super(message);
        }

        public EmailDeliveryException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
