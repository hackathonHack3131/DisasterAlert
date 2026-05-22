package com.disaster.controller;

import com.disaster.integration.NasaFirmsService;
import com.disaster.integration.OpenWeatherService;
import com.disaster.service.EmailService;
import com.disaster.service.TwilioSmsService;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/integrations")
public class IntegrationController {

    private final OpenWeatherService openWeatherService;
    private final NasaFirmsService nasaFirmsService;
    private final EmailService emailService;
    private final TwilioSmsService twilioSmsService;

    @Value("${app.openweather.api-key:}")
    private String openWeatherKey;

    public IntegrationController(
            OpenWeatherService openWeatherService,
            NasaFirmsService nasaFirmsService,
            EmailService emailService,
            TwilioSmsService twilioSmsService) {
        this.openWeatherService = openWeatherService;
        this.nasaFirmsService = nasaFirmsService;
        this.emailService = emailService;
        this.twilioSmsService = twilioSmsService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        return ResponseEntity.ok(Map.of(
                "email", emailService.isConfigured(),
                "twilio", twilioSmsService.isConfigured(),
                "nasaFirms", nasaFirmsService.status(),
                "openWeather", openWeatherKey != null && !openWeatherKey.isBlank()
        ));
    }

    @GetMapping("/weather")
    public ResponseEntity<Map<String, Object>> weather(
            @RequestParam(defaultValue = "19.076") double lat,
            @RequestParam(defaultValue = "72.8777") double lng) {
        return ResponseEntity.ok(openWeatherService.fetchCurrent(lat, lng));
    }
}
