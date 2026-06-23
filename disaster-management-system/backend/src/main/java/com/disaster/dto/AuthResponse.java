package com.disaster.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String role;
    private String username;
    private String message;
    private boolean requireOtp;
    private String email;

    public AuthResponse(String token, String role, String username, String message) {
        this.token = token;
        this.role = role;
        this.username = username;
        this.message = message;
        this.requireOtp = false;
        this.email = null;
    }
}
