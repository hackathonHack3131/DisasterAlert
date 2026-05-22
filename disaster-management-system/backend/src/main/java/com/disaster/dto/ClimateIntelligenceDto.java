package com.disaster.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClimateIntelligenceDto {
    private double latitude;
    private double longitude;
    private String locationName;
    private double rainfallMm;
    private int humidityPercent;
    private double temperatureC;
    private double windSpeedMs;
    private int riskScore;
    private String riskLevel;
    private String weatherCondition;
    private String dataSource;
    private List<HeatmapPoint> rainfallHeatmap = new ArrayList<>();
    private List<HeatmapPoint> humidityHeatmap = new ArrayList<>();
    private List<HeatmapPoint> riskHeatmap = new ArrayList<>();
    private List<FloodZonePolygon> floodZones = new ArrayList<>();
    private Map<String, String> layerTileUrls;
    private boolean geeAvailable;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class HeatmapPoint {
        private double lat;
        private double lng;
        private double weight;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class FloodZonePolygon {
        private String id;
        private String risk; // WARNING, HIGH, CRITICAL
        private List<List<Double>> coordinates; // [lng, lat] pairs
    }
}
