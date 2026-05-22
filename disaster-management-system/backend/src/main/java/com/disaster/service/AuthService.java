package com.disaster.service;

import com.disaster.config.JwtService;
import com.disaster.dto.AuthResponse;
import com.disaster.model.OtpVerification;
import com.disaster.model.User;
import com.disaster.model.UserRole;
import com.disaster.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final OtpService otpService;
    private final EmailService emailService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    public AuthService(
            UserRepository userRepository,
            OtpService otpService,
            EmailService emailService,
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.otpService = otpService;
        this.emailService = emailService;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
    }

    public Map<String, String> registerPending(UserRegistrationData data) {
        if (userRepository.existsByUsername(data.username())) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(data.email())) {
            throw new IllegalArgumentException("Email already exists");
        }
        try {
            String payload = objectMapper.writeValueAsString(data);
            String otp = otpService.generateAndStore(data.email(), OtpVerification.OtpPurpose.USER_REGISTER, payload);
            emailService.sendOtpEmail(data.email(), otp);
            return Map.of("message", "OTP sent to your email. Check inbox and spam folder.", "email", data.email());
        } catch (EmailService.EmailDeliveryException e) {
            otpService.deleteByEmail(data.email());
            throw new IllegalArgumentException("Failed to send OTP email: " + e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException("Registration failed", e);
        }
    }

    public AuthResponse verifyOtp(String email, String otp) {
        OtpVerification record = otpService.verify(email, otp);
        try {
            UserRegistrationData data = objectMapper.readValue(record.getPayloadJson(), UserRegistrationData.class);
            User user = User.builder()
                    .username(data.username())
                    .email(data.email())
                    .password(passwordEncoder.encode(data.password()))
                    .location(data.location())
                    .state(data.state())
                    .city(data.city())
                    .role(UserRole.CITIZEN)
                    .verified(true)
                    .latitude(20.5937)
                    .longitude(78.9629)
                    .createdAt(Instant.now())
                    .build();
            userRepository.save(user);
            String token = jwtService.generateToken(user.getUsername(),
                    Map.of("role", user.getRole().name(), "userId", user.getId()));
            return new AuthResponse(token, user.getRole().name(), user.getUsername(), "Account created");
        } catch (Exception e) {
            throw new RuntimeException("Verification failed", e);
        }
    }

    public AuthResponse login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        String token = jwtService.generateToken(user.getUsername(),
                Map.of("role", user.getRole().name(), "userId", user.getId()));
        return new AuthResponse(token, user.getRole().name(), user.getUsername(), "Login successful");
    }

    public record UserRegistrationData(
            String username, String email, String password,
            String location, String state, String city) {}
}
