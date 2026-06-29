package com.disaster.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          CorsConfigurationSource corsConfigurationSource) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.corsConfigurationSource = corsConfigurationSource;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        // ── OPTIONS preflight — always allow ──────────────────────────
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ── WebSocket ─────────────────────────────────────────────────
                        .requestMatchers("/ws/**", "/ws/info/**").permitAll()

                        // ── Citizen Auth ──────────────────────────────────────────────
                        .requestMatchers("/api/auth/**").permitAll()

                        // ── Organisation Auth ─────────────────────────────────────────
                        .requestMatchers("/api/org/auth/**").permitAll()
                        .requestMatchers("/api/org/register").permitAll()
                        .requestMatchers("/api/org/login").permitAll()
                        .requestMatchers("/api/org/verify-otp").permitAll()
                        .requestMatchers("/api/org/resend-otp").permitAll()

                        // ── Organisation Public (homepage + map) ──────────────────────
                        .requestMatchers(HttpMethod.GET, "/api/org/public/**").permitAll()

                        // ── Shelter Public (map display) ──────────────────────────────
                        .requestMatchers(HttpMethod.GET, "/api/shelters/public/**").permitAll()

                        // ── Disaster Public (map markers + UptimeRobot) ───────────────
                        .requestMatchers(HttpMethod.GET, "/api/disasters/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/simulate/active").permitAll()

                        // ── Rescue Public ─────────────────────────────────────────────
                        .requestMatchers(HttpMethod.POST, "/api/rescue/request").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/rescue/nearby").permitAll()

                        // ── Public / Integrations / AI ────────────────────────────────
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers("/api/integrations/**").permitAll()
                        .requestMatchers("/api/ai/**").permitAll()

                        // ── Health check for UptimeRobot ──────────────────────────────
                        .requestMatchers(HttpMethod.GET, "/api/health").permitAll()
                        .requestMatchers(HttpMethod.GET, "/actuator/health").permitAll()

                        // ── Simulation — any logged-in user ───────────────────────────
                        .requestMatchers("/api/events/simulate").authenticated()
                        .requestMatchers("/api/simulate/**").authenticated()

                        // ── Climate — authenticated ───────────────────────────────────
                        .requestMatchers("/api/climate/**").authenticated()

                        // ── Everything else requires auth ─────────────────────────────
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}