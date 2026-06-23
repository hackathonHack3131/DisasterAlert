package com.disaster.controller;

import com.disaster.model.DisasterEvent;
import com.disaster.model.DisasterType;
import com.disaster.model.EventSource;
import com.disaster.repository.DisasterEventRepository;
import com.disaster.service.DisasterService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/simulate")
public class SimulationController {

    private final DisasterService disasterService;
    private final DisasterEventRepository disasterRepository;

    public SimulationController(DisasterService disasterService, DisasterEventRepository disasterRepository) {
        this.disasterService = disasterService;
        this.disasterRepository = disasterRepository;
    }

    @PostMapping("/disaster")
    public ResponseEntity<DisasterService.SimulationResult> simulateGeneral(@RequestBody SimulateRequest req) {
        DisasterType type = req.type() != null ? req.type() : DisasterType.FLOOD;
        return ResponseEntity.ok(disasterService.processDisaster(buildEvent(type, req)));
    }

    @PostMapping("/flood")
    public ResponseEntity<DisasterService.SimulationResult> simulateFlood(@RequestBody SimulateRequest req) {
        return ResponseEntity.ok(disasterService.processDisaster(buildEvent(DisasterType.FLOOD, req)));
    }

    @PostMapping("/fire")
    public ResponseEntity<DisasterService.SimulationResult> simulateFire(@RequestBody SimulateRequest req) {
        return ResponseEntity.ok(disasterService.processDisaster(buildEvent(DisasterType.FIRE, req)));
    }

    @PostMapping("/earthquake")
    public ResponseEntity<DisasterService.SimulationResult> simulateEarthquake(@RequestBody SimulateRequest req) {
        return ResponseEntity.ok(disasterService.processDisaster(buildEvent(DisasterType.EARTHQUAKE, req)));
    }

    @PostMapping("/cyclone")
    public ResponseEntity<DisasterService.SimulationResult> simulateCyclone(@RequestBody SimulateRequest req) {
        return ResponseEntity.ok(disasterService.processDisaster(buildEvent(DisasterType.CYCLONE, req)));
    }

    @PostMapping("/landslide")
    public ResponseEntity<DisasterService.SimulationResult> simulateLandslide(@RequestBody SimulateRequest req) {
        return ResponseEntity.ok(disasterService.processDisaster(buildEvent(DisasterType.LANDSLIDE, req)));
    }

    @GetMapping("/active")
    public ResponseEntity<List<DisasterEvent>> getActive() {
        return ResponseEntity.ok(disasterRepository.findByActiveTrueOrderByTimestampDesc());
    }

    @PatchMapping("/resolve/{id}")
    public ResponseEntity<Map<String, String>> resolve(@PathVariable String id) {
        disasterService.resolveDisaster(id);
        return ResponseEntity.ok(Map.of("status", "resolved", "id", id));
    }

    private DisasterEvent buildEvent(DisasterType type, SimulateRequest req) {
        String msg = req.message();
        if (msg == null || msg.isBlank()) {
            msg = "SIMULATION: " + type + " emergency drills in progress. Local shelters active. Stay indoors.";
        }
        return DisasterEvent.builder()
                .disasterType(type)
                .severity(req.severity() > 0 ? req.severity() : 8)
                .location(req.location() != null ? req.location() : "Simulated Zone, India")
                .latitude(req.latitude() != 0 ? req.latitude() : 19.0760)
                .longitude(req.longitude() != 0 ? req.longitude() : 72.8777)
                .timestamp(Instant.now())
                .message(msg)
                .affectedRadius(req.affectedRadius() > 0 ? req.affectedRadius() : 15)
                .source(EventSource.SIMULATION)
                .active(true)
                .build();
    }

    public record SimulateRequest(
            DisasterType type,
            int severity,
            String location,
            double latitude,
            double longitude,
            double affectedRadius,
            String message
    ) {}
}
