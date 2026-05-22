package com.disaster.controller;

import com.disaster.model.RescueRequest;
import com.disaster.repository.RescueRequestRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/rescue")
public class RescueController {

    private final RescueRequestRepository rescueRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public RescueController(RescueRequestRepository rescueRepository, SimpMessagingTemplate messagingTemplate) {
        this.rescueRepository = rescueRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping("/request")
    public ResponseEntity<RescueRequest> create(@RequestBody RescueRequest request) {
        request.setStatus(RescueRequest.RescueStatus.PENDING);
        request.setCreatedAt(Instant.now());
        request.syncGeo();
        RescueRequest saved = rescueRepository.save(request);
        messagingTemplate.convertAndSend("/topic/rescue", saved);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public ResponseEntity<List<RescueRequest>> list() {
        return ResponseEntity.ok(rescueRepository.findAll());
    }

    @GetMapping("/pending")
    public ResponseEntity<List<RescueRequest>> pending() {
        return ResponseEntity.ok(rescueRepository.findByStatus(RescueRequest.RescueStatus.PENDING));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<RescueRequest> updateStatus(
            @PathVariable String id,
            @RequestBody StatusUpdate update) {
        RescueRequest req = rescueRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));
        req.setStatus(update.status());
        RescueRequest saved = rescueRepository.save(req);
        messagingTemplate.convertAndSend("/topic/rescue", saved);
        return ResponseEntity.ok(saved);
    }

    public record StatusUpdate(RescueRequest.RescueStatus status) {}
}
