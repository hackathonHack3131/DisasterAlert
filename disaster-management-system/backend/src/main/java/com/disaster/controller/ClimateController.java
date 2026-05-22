package com.disaster.controller;

import com.disaster.dto.ClimateIntelligenceDto;
import com.disaster.service.ClimateIntelligenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/climate")
public class ClimateController {

    private final ClimateIntelligenceService climateService;

    public ClimateController(ClimateIntelligenceService climateService) {
        this.climateService = climateService;
    }

    @GetMapping("/intelligence")
    public ResponseEntity<ClimateIntelligenceDto> intelligence(
            @RequestParam(defaultValue = "19.076") double lat,
            @RequestParam(defaultValue = "72.8777") double lng,
            @RequestParam(defaultValue = "0") int hourOffset) {
        if (hourOffset > 0) {
            return ResponseEntity.ok(climateService.getIntelligenceWithTimeOffset(lat, lng, hourOffset));
        }
        return ResponseEntity.ok(climateService.getIntelligence(lat, lng));
    }
}
