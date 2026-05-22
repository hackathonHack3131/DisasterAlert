package com.disaster.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "alerts")
public class Alert {
    @Id
    private String id;
    private String disasterEventId;
    private DisasterType disasterType;
    private int severity;
    private String message;
    private String location;
    private double latitude;
    private double longitude;
    private Instant timestamp;
}
