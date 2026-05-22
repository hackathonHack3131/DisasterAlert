package com.disaster.service;

import com.disaster.config.JwtService;
import com.disaster.dto.AuthResponse;
import com.disaster.model.OtpVerification;
import com.disaster.model.Organisation;
import com.disaster.repository.OrganisationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

@Service
public class OrganisationAuthService {

    private final OrganisationRepository organisationRepository;
    private final OtpService otpService;
    private final EmailService emailService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    public OrganisationAuthService(
            OrganisationRepository organisationRepository,
            OtpService otpService,
            EmailService emailService,
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            ObjectMapper objectMapper) {
        this.organisationRepository = organisationRepository;
        this.otpService = otpService;
        this.emailService = emailService;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
    }

    public Map<String, String> registerPending(OrgRegistrationData data) {
        if (organisationRepository.existsByEmail(data.email())) {
            throw new IllegalArgumentException("Email already registered");
        }
        try {
            String payload = objectMapper.writeValueAsString(data);
            String otp = otpService.generateAndStore(data.email(), OtpVerification.OtpPurpose.ORG_REGISTER, payload);
            emailService.sendOtpEmail(data.email(), otp);
            return Map.of("message", "OTP sent to your email. Check inbox and spam folder.", "email", data.email());
        } catch (EmailService.EmailDeliveryException e) {
            otpService.deleteByEmail(data.email());
            throw new IllegalArgumentException("Failed to send OTP email: " + e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException("Organisation registration failed", e);
        }
    }

    public AuthResponse verifyOtp(String email, String otp) {
        OtpVerification record = otpService.verify(email, otp);
        try {
            OrgRegistrationData data = objectMapper.readValue(record.getPayloadJson(), OrgRegistrationData.class);
            Organisation org = Organisation.builder()
                    .organisationName(data.organisationName())
                    .email(data.email())
                    .password(passwordEncoder.encode(data.password()))
                    .country(data.country())
                    .state(data.state())
                    .city(data.city())
                    .headquartersLocation(data.headquartersLocation())
                    .verified(true)
                    .activeStatus(true)
                    .latitude(20.5937)
                    .longitude(78.9629)
                    .createdAt(Instant.now())
                    .build();
            org.syncGeo();
            organisationRepository.save(org);
            String token = jwtService.generateToken(org.getEmail(),
                    Map.of("role", "ROLE_ORGANISATION", "orgId", org.getId()));
            return new AuthResponse(token, "ROLE_ORGANISATION", org.getOrganisationName(), "Organisation activated");
        } catch (Exception e) {
            throw new RuntimeException("Verification failed", e);
        }
    }

    public AuthResponse login(String email, String password) {
        Organisation org = organisationRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
        if (!passwordEncoder.matches(password, org.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        String token = jwtService.generateToken(org.getEmail(),
                Map.of("role", "ROLE_ORGANISATION", "orgId", org.getId()));
        return new AuthResponse(token, "ROLE_ORGANISATION", org.getOrganisationName(), "Login successful");
    }

    public Organisation updateProfile(String email, Organisation updates) {
        Organisation org = organisationRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Organisation not found"));
        if (updates.getDescription() != null) org.setDescription(updates.getDescription());
        if (updates.getLogoUrl() != null) org.setLogoUrl(updates.getLogoUrl());
        if (updates.getSupportTypes() != null) org.setSupportTypes(updates.getSupportTypes());
        if (updates.getResourcesAvailable() != null) org.setResourcesAvailable(updates.getResourcesAvailable());
        if (updates.getShelterCapacity() > 0) org.setShelterCapacity(updates.getShelterCapacity());
        if (updates.getContactNumber() != null) org.setContactNumber(updates.getContactNumber());
        if (updates.getWebsite() != null) org.setWebsite(updates.getWebsite());
        org.syncGeo();
        return organisationRepository.save(org);
    }

    public record OrgRegistrationData(
            String organisationName, String email, String password,
            String country, String state, String city, String headquartersLocation) {}
}
