package com.disaster.controller;

import com.disaster.model.Shelter;
import com.disaster.repository.ShelterRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shelters")
public class ShelterController {

    private final ShelterRepository shelterRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ShelterController(ShelterRepository shelterRepository, SimpMessagingTemplate messagingTemplate) {
        this.shelterRepository = shelterRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @GetMapping
    public ResponseEntity<List<Shelter>> list() {
        return ResponseEntity.ok(shelterRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Shelter> create(@RequestBody Shelter shelter) {
        shelter.syncGeo();
        if (shelter.getStatus() == null) shelter.setStatus(Shelter.ShelterStatus.INACTIVE);
        Shelter saved = shelterRepository.save(shelter);
        messagingTemplate.convertAndSend("/topic/shelters", saved);
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}/occupancy")
    public ResponseEntity<Shelter> updateOccupancy(@PathVariable String id, @RequestBody OccupancyUpdate update) {
        Shelter shelter = shelterRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Shelter not found"));
        shelter.setAvailableBeds(update.availableBeds());
        if (shelter.getAvailableBeds() <= 0) {
            shelter.setStatus(Shelter.ShelterStatus.FULL);
        }
        Shelter saved = shelterRepository.save(shelter);
        messagingTemplate.convertAndSend("/topic/shelters", saved);
        return ResponseEntity.ok(saved);
    }

    public record OccupancyUpdate(int availableBeds) {}
}
