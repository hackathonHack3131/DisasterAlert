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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        // ── OPTIONS preflight — always allow ──────────────────────────────
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ── WebSocket ─────────────────────────────────────────────────────
                        .requestMatchers("/ws/**", "/ws/info/**").permitAll()

                        // ── Citizen Auth ──────────────────────────────────────────────────
                        .requestMatchers("/api/auth/**").permitAll()

                        // ── Organisation Auth ─────────────────────────────────────────────
                        .requestMatchers("/api/org/auth/**").permitAll()
                        .requestMatchers("/api/org/register").permitAll()
                        .requestMatchers("/api/org/login").permitAll()
                        .requestMatchers("/api/org/verify-otp").permitAll()
                        .requestMatchers("/api/org/resend-otp").permitAll()

                        // ── Organisation Public endpoints (homepage + map) ─────────────────
                        .requestMatchers(HttpMethod.GET, "/api/org/public/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/org/public/all").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/org/public/nearby").permitAll()

                        // ── Shelter Public endpoints (map display) ────────────────────────
                        .requestMatchers(HttpMethod.GET, "/api/shelters/public/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/shelters/public/all").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/shelters/public/nearby").permitAll()

                        // ── Disaster public endpoints (map markers + UptimeRobot) ──────────
                        .requestMatchers(HttpMethod.GET, "/api/disasters/active").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/disasters/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/simulate/active").permitAll()

                        // ── SOS beacon — citizen submits without login ─────────────────────
                        .requestMatchers("/api/rescue/request").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/rescue/nearby").permitAll()

                        // ── Public integrations and AI endpoints ──────────────────────────
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers("/api/integrations/**").permitAll()
                        .requestMatchers("/api/ai/**").permitAll()

                        // ── Health check endpoint for UptimeRobot ─────────────────────────
                        .requestMatchers(HttpMethod.GET, "/api/health").permitAll()
                        .requestMatchers(HttpMethod.GET, "/actuator/health").permitAll()

                        // ── Simulation — any logged-in user ───────────────────────────────
                        .requestMatchers("/api/events/simulate", "/api/simulate/**").authenticated()

                        // ── Climate — authenticated ───────────────────────────────────────
                        .requestMatchers("/api/climate/**").authenticated()

                        // ── Everything else requires authentication ────────────────────────
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOriginPatterns(List.of(
                "http://localhost:5173",
                "http://localhost:3000",
                "http://localhost:8080",
                "https://*.vercel.app",
                "https://smart-disaster-system.vercel.app"
        ));

        config.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));

        config.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "Origin",
                "X-Requested-With",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers"
        ));

        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
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