package com.disaster.service;

import com.disaster.model.OtpVerification;
import com.disaster.repository.OtpVerificationRepository;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class OtpService {

    private final OtpVerificationRepository otpRepository;
    private final SecureRandom random = new SecureRandom();

    public OtpService(OtpVerificationRepository otpRepository) {
        this.otpRepository = otpRepository;
    }

    public String generateAndStore(String email, OtpVerification.OtpPurpose purpose, String payloadJson) {
        otpRepository.deleteByEmail(email);
        String otp = String.format("%06d", random.nextInt(1_000_000));
        OtpVerification record = OtpVerification.builder()
                .email(email)
                .otp(otp)
                .expiresAt(Instant.now().plus(5, ChronoUnit.MINUTES))
                .purpose(purpose)
                .payloadJson(payloadJson)
                .build();
        otpRepository.save(record);
        return otp;
    }

    public void deleteByEmail(String email) {
        otpRepository.deleteByEmail(email);
    }

    public OtpVerification verify(String email, String otp) {
        OtpVerification record = otpRepository.findByEmailAndOtp(email, otp)
                .orElseThrow(() -> new IllegalArgumentException("Invalid OTP"));
        if (record.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("OTP expired");
        }
        otpRepository.delete(record);
        return record;
    }
}
