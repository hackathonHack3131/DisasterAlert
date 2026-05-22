package com.disaster.controller;

import com.disaster.dto.AuthResponse;
import com.disaster.model.Organisation;
import com.disaster.service.OrganisationAuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/org")
public class OrgAuthController {

    private final OrganisationAuthService orgAuthService;

    public OrgAuthController(OrganisationAuthService orgAuthService) {
        this.orgAuthService = orgAuthService;
    }

    @PostMapping("/auth/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody OrgRegisterRequest req) {
        if (!req.password().equals(req.confirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }
        var data = new OrganisationAuthService.OrgRegistrationData(
                req.organisationName(), req.email(), req.password(),
                req.country(), req.state(), req.city(), req.headquartersLocation());
        return ResponseEntity.ok(orgAuthService.registerPending(data));
    }

    @PostMapping("/auth/verify-otp")
    public ResponseEntity<AuthResponse> verifyOtp(@RequestBody OtpRequest req) {
        return ResponseEntity.ok(orgAuthService.verifyOtp(req.email(), req.otp()));
    }

    @PostMapping("/auth/login")
    public ResponseEntity<AuthResponse> login(@RequestBody OrgLoginRequest req) {
        return ResponseEntity.ok(orgAuthService.login(req.email(), req.password()));
    }

    @PutMapping("/profile")
    public ResponseEntity<Organisation> updateProfile(Authentication auth, @RequestBody Organisation updates) {
        return ResponseEntity.ok(orgAuthService.updateProfile(auth.getName(), updates));
    }

    public record OrgRegisterRequest(
            @NotBlank String organisationName,
            @Email String email,
            @NotBlank String password,
            @NotBlank String confirmPassword,
            String country, String state, String city, String headquartersLocation) {}

    public record OtpRequest(@Email String email, @NotBlank String otp) {}

    public record OrgLoginRequest(@Email String email, @NotBlank String password) {}
}
