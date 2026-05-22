package com.disaster.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeoLocation {
    private String type = "Point";
    private double[] coordinates; // [longitude, latitude]

    public static GeoLocation of(double latitude, double longitude) {
        return GeoLocation.builder()
                .type("Point")
                .coordinates(new double[]{longitude, latitude})
                .build();
    }
}
