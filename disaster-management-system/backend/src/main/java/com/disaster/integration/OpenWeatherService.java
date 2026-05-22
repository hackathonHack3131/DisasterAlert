package com.disaster.integration;

import com.disaster.model.DisasterEvent;
import com.disaster.model.DisasterType;
import com.disaster.model.EventSource;
import com.disaster.service.EventProcessorService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Map;

@Service
public class OpenWeatherService {

    private static final Logger log = LoggerFactory.getLogger(OpenWeatherService.class);

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final EventProcessorService eventProcessor;

    @Value("${app.openweather.api-key:}")
    private String apiKey;

    @Value("${app.integrations.auto-ingest:false}")
    private boolean autoIngest;

    public OpenWeatherService(EventProcessorService eventProcessor) {
        this.eventProcessor = eventProcessor;
    }

    public Map<String, Object> fetchCurrent(double lat, double lng) {
        if (apiKey == null || apiKey.isBlank()) {
            return Map.of("error", "OpenWeather API key not configured");
        }
        String url = String.format(
                "https://api.openweathermap.org/data/2.5/weather?lat=%f&lon=%f&appid=%s&units=metric",
                lat, lng, apiKey);
        try {
            String json = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(json);
            return Map.of(
                    "location", root.path("name").asText("Unknown"),
                    "temp", root.path("main").path("temp").asDouble(),
                    "humidity", root.path("main").path("humidity").asInt(),
                    "weather", root.path("weather").get(0).path("main").asText(),
                    "description", root.path("weather").get(0).path("description").asText(),
                    "windSpeed", root.path("wind").path("speed").asDouble()
            );
        } catch (Exception e) {
            log.error("OpenWeather fetch failed: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    /** Poll Mumbai region every 30 min; ingest flood/cyclone signals when severe weather detected. */
    @Scheduled(fixedRate = 1_800_000, initialDelay = 60_000)
    public void pollSevereWeather() {
        if (!autoIngest || apiKey == null || apiKey.isBlank()) return;
        Map<String, Object> data = fetchCurrent(19.076, 72.8777);
        if (data.containsKey("error")) return;

        String weather = String.valueOf(data.get("weather")).toUpperCase();
        double wind = ((Number) data.getOrDefault("windSpeed", 0)).doubleValue();

        if (weather.contains("RAIN") && wind > 10) {
            ingestEvent(DisasterType.FLOOD, 7, "OpenWeather: Heavy rain detected near Mumbai", 19.076, 72.8777);
        } else if (weather.contains("THUNDER") || wind > 15) {
            ingestEvent(DisasterType.CYCLONE, 8, "OpenWeather: Severe storm conditions near Mumbai", 19.076, 72.8777);
        }
    }

    private void ingestEvent(DisasterType type, int severity, String message, double lat, double lng) {
        DisasterEvent event = DisasterEvent.builder()
                .disasterType(type)
                .severity(severity)
                .location("Mumbai Region (OpenWeather)")
                .latitude(lat)
                .longitude(lng)
                .timestamp(Instant.now())
                .message(message)
                .affectedRadius(20)
                .source(EventSource.OPENWEATHER)
                .build();
        eventProcessor.processEvent(event);
        log.info("Ingested OpenWeather event: {}", type);
    }
}
