package com.disaster.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "disaster_logs")
public class DisasterLog {
    @Id
    private String id;
    private DisasterType disasterType;
    private int severity;
    private String location;
    private double latitude;
    private double longitude;
    @GeoSpatialIndexed
    private GeoLocation geoLocation;
    private Instant timestamp;
    private String message;
    private double affectedRadius;
    private boolean active;

    public void syncGeo() {
        this.geoLocation = GeoLocation.of(latitude, longitude);
    }
}
