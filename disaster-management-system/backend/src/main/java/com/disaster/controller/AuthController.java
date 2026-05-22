package com.disaster.controller;

import com.disaster.dto.AuthResponse;
import com.disaster.service.AuthService;
import com.disaster.service.EmailService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final EmailService emailService;

    public AuthController(AuthService authService, EmailService emailService) {
        this.authService = authService;
        this.emailService = emailService;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest req) {
        if (!req.password().equals(req.confirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }
        var data = new AuthService.UserRegistrationData(
                req.username(), req.email(), req.password(),
                req.location(), req.state(), req.city());
        return ResponseEntity.ok(authService.registerPending(data));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<AuthResponse> verifyOtp(@RequestBody OtpRequest req) {
        return ResponseEntity.ok(authService.verifyOtp(req.email(), req.otp()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req.username(), req.password()));
    }

    /** Send test OTP email — use to verify mail config */
    @PostMapping("/test-email")
    public ResponseEntity<Map<String, String>> testEmail(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("email is required");
        }
        try {
            emailService.sendOtpEmail(email, "123456");
            return ResponseEntity.ok(Map.of("message", "Test OTP email sent to " + email));
        } catch (EmailService.EmailDeliveryException e) {
            throw new IllegalArgumentException(e.getMessage());
        }
    }

    public record RegisterRequest(
            @NotBlank String username,
            @Email String email,
            @NotBlank String password,
            @NotBlank String confirmPassword,
            String location,
            String state,
            String city) {}

    public record OtpRequest(@Email String email, @NotBlank String otp) {}

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {}
}
