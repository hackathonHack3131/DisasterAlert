package com.disaster.dto;

import com.disaster.model.DisasterEvent;
import com.disaster.model.DisasterType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class AlertMessage {
    private String id;
    private DisasterType disasterType;
    private int severity;
    private String location;
    private double latitude;
    private double longitude;
    private String message;
    private Instant timestamp;
    private double affectedRadius;

    public static AlertMessage from(DisasterEvent e) {
        return AlertMessage.builder()
                .id(e.getId())
                .disasterType(e.getDisasterType())
                .severity(e.getSeverity())
                .location(e.getLocation())
                .latitude(e.getLatitude())
                .longitude(e.getLongitude())
                .message(e.getMessage())
                .timestamp(e.getTimestamp())
                .affectedRadius(e.getAffectedRadius())
                .build();
    }
}
