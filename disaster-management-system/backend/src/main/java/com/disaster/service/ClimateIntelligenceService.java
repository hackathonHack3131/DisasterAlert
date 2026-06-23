package com.disaster.service;

import com.disaster.dto.ClimateIntelligenceDto;
import com.disaster.dto.ClimateIntelligenceDto.FloodZonePolygon;
import com.disaster.dto.ClimateIntelligenceDto.HeatmapPoint;
import com.disaster.integration.OpenWeatherService;
import com.disaster.model.DisasterEvent;
import com.disaster.repository.DisasterEventRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ClimateIntelligenceService {

    private final OpenWeatherService openWeatherService;
    private final DisasterEventRepository disasterRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.gee.service-url:http://localhost:5050}")
    private String geeServiceUrl;

    public ClimateIntelligenceService(
            OpenWeatherService openWeatherService,
            DisasterEventRepository disasterRepository) {
        this.openWeatherService = openWeatherService;
        this.disasterRepository = disasterRepository;
    }

    public ClimateIntelligenceDto getIntelligence(double lat, double lng) {
        Map<String, Object> weather = openWeatherService.fetchCurrent(lat, lng);
        double rainfall = estimateRainfall(weather);
        int humidity = ((Number) weather.getOrDefault("humidity", 55)).intValue();
        double temp = ((Number) weather.getOrDefault("temp", 28.0)).doubleValue();
        double wind = ((Number) weather.getOrDefault("windSpeed", 3.0)).doubleValue();
        String condition = String.valueOf(weather.getOrDefault("weather", "Clear"));
        String location = String.valueOf(weather.getOrDefault("location", "Monitored Zone"));

        int eventBoost = disasterRepository.findTop20ByOrderByTimestampDesc().stream()
                .filter(e -> distanceKm(lat, lng, e.getLatitude(), e.getLongitude()) < 100)
                .mapToInt(DisasterEvent::getSeverity)
                .sum();

        int riskScore = computeRiskScore(rainfall, humidity, wind, condition, eventBoost);
        String riskLevel = riskLevelFromScore(riskScore);

        List<HeatmapPoint> rainfallGrid = buildGrid(lat, lng, rainfall / 50.0, 0.35);
        List<HeatmapPoint> humidityGrid = buildGrid(lat, lng, humidity / 100.0, 0.28);
        List<HeatmapPoint> riskGrid = buildGrid(lat, lng, riskScore / 100.0, 0.4);

        List<FloodZonePolygon> floodZones = generateFloodZones(lat, lng, rainfall, riskScore);

        Map<String, String> layerTiles = tryGeeTiles(lat, lng);

        return ClimateIntelligenceDto.builder()
                .latitude(lat)
                .longitude(lng)
                .locationName(location)
                .rainfallMm(rainfall)
                .humidityPercent(humidity)
                .temperatureC(temp)
                .windSpeedMs(wind)
                .riskScore(riskScore)
                .riskLevel(riskLevel)
                .weatherCondition(condition)
                .dataSource(layerTiles.isEmpty() ? "OpenWeather + Climate Model" : "Google Earth Engine + OpenWeather")
                .rainfallHeatmap(rainfallGrid)
                .humidityHeatmap(humidityGrid)
                .riskHeatmap(riskGrid)
                .floodZones(floodZones)
                .layerTileUrls(layerTiles)
                .geeAvailable(!layerTiles.isEmpty())
                .build();
    }

    public ClimateIntelligenceDto getIntelligenceWithTimeOffset(double lat, double lng, int hourOffset) {
        ClimateIntelligenceDto base = getIntelligence(lat, lng);
        double factor = 0.7 + 0.3 * Math.sin(hourOffset * 0.5);
        base.setRainfallMm(Math.round(base.getRainfallMm() * factor * 10) / 10.0);
        base.setRiskScore(Math.min(100, (int) (base.getRiskScore() * factor)));
        base.setRiskLevel(riskLevelFromScore(base.getRiskScore()));
        base.setRainfallHeatmap(buildGrid(lat, lng, base.getRainfallMm() / 50.0, 0.35));
        base.setRiskHeatmap(buildGrid(lat, lng, base.getRiskScore() / 100.0, 0.4));
        return base;
    }

    private double estimateRainfall(Map<String, Object> weather) {
        String desc = String.valueOf(weather.getOrDefault("description", "")).toLowerCase();
        String main = String.valueOf(weather.getOrDefault("weather", "")).toLowerCase();
        if (main.contains("rain") || desc.contains("rain")) return 35 + Math.random() * 25;
        if (main.contains("drizzle") || desc.contains("drizzle")) return 12 + Math.random() * 10;
        if (main.contains("thunder") || desc.contains("storm")) return 45 + Math.random() * 30;
        if (main.contains("cloud")) return 5 + Math.random() * 8;
        return Math.random() * 4;
    }

    private int computeRiskScore(double rainfall, int humidity, double wind, String condition, int eventBoost) {
        int score = (int) Math.min(40, rainfall * 0.8);
        score += humidity > 80 ? 20 : humidity > 65 ? 10 : 0;
        score += wind > 12 ? 15 : wind > 8 ? 8 : 0;
        if (condition.toUpperCase().contains("RAIN") || condition.toUpperCase().contains("STORM")) {
            score += 15;
        }
        score += Math.min(25, eventBoost * 2);
        return Math.min(100, Math.max(0, score));
    }

    private String riskLevelFromScore(int score) {
        if (score >= 75) return "CRITICAL";
        if (score >= 55) return "HIGH";
        if (score >= 35) return "WARNING";
        return "LOW";
    }

    private List<HeatmapPoint> buildGrid(double centerLat, double centerLng, double intensity, double spread) {
        List<HeatmapPoint> points = new ArrayList<>();
        for (int i = -8; i <= 8; i++) {
            for (int j = -8; j <= 8; j++) {
                double dist = Math.sqrt(i * i + j * j);
                double weight = Math.min(1.0, intensity * Math.exp(-dist * dist / (2 * spread * 12)) * 1.4);
                if (weight > 0.03) {
                    points.add(new HeatmapPoint(
                            centerLat + i * 0.06,
                            centerLng + j * 0.06,
                            Math.min(1.0, weight)));
                }
            }
        }
        return points;
    }

    private List<FloodZonePolygon> generateFloodZones(double lat, double lng, double rainfall, int riskScore) {
        List<FloodZonePolygon> zones = new ArrayList<>();
        // Always show at least warning zones for map demo / Konkan coastal flood risk
        if (rainfall < 5 && riskScore < 25) {
            zones.add(polygonAround("flood-coastal", lat, lng, 0.25, 0.35, "WARNING"));
            return zones;
        }

        String risk = riskScore >= 70 ? "CRITICAL" : riskScore >= 50 ? "HIGH" : "WARNING";
        zones.add(polygonAround("flood-1", lat, lng, 0.35, 0.45, risk));
        zones.add(polygonAround("flood-2", lat + 0.4, lng + 0.3, 0.25, 0.35, risk));
        if (rainfall > 30) {
            zones.add(polygonAround("flood-3", lat - 0.3, lng - 0.25, 0.2, 0.3, "HIGH"));
        }
        return zones;
    }

    private FloodZonePolygon polygonAround(String id, double lat, double lng, double latR, double lngR, String risk) {
        List<List<Double>> ring = new ArrayList<>();
        for (int a = 0; a <= 360; a += 45) {
            double rad = Math.toRadians(a);
            ring.add(List.of(
                    lng + lngR * Math.cos(rad),
                    lat + latR * Math.sin(rad)));
        }
        return new FloodZonePolygon(id, risk, ring);
    }

    @SuppressWarnings("unchecked")
    private Map<String, String> tryGeeTiles(double lat, double lng) {
        try {
            String url = geeServiceUrl + "/api/layers?lat=" + lat + "&lng=" + lng;
            Map<String, Object> resp = restTemplate.getForObject(url, Map.class);
            if (resp != null && resp.get("tiles") instanceof Map<?, ?> tiles) {
                Map<String, String> result = new HashMap<>();
                tiles.forEach((k, v) -> result.put(String.valueOf(k), String.valueOf(v)));
                return result;
            }
        } catch (Exception ignored) {
            // GEE Python service optional
        }
        return Map.of();
    }

    private double distanceKm(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
