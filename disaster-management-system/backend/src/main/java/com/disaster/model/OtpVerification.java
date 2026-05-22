package com.disaster.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "otp_verifications")
public class OtpVerification {
    @Id
    private String id;
    private String email;
    private String otp;
    private Instant expiresAt;
    private OtpPurpose purpose;
    private String payloadJson;

    public enum OtpPurpose {
        USER_REGISTER, ORG_REGISTER
    }
}
