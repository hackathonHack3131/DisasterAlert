package com.disaster.repository;

import com.disaster.model.OtpVerification;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface OtpVerificationRepository extends MongoRepository<OtpVerification, String> {
    Optional<OtpVerification> findByEmailAndOtp(String email, String otp);
    void deleteByEmail(String email);
}
