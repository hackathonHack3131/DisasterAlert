package com.disaster.controller;

import com.disaster.service.AiRiskService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiAnalysisController {
    
    private final AiRiskService aiRiskService;

    public AiAnalysisController(AiRiskService aiRiskService) {
        this.aiRiskService = aiRiskService;
    }

    @GetMapping("/threat-analysis")
    public ResponseEntity<AiRiskService.AiThreatAnalysis> analyze(@RequestParam double lat, @RequestParam double lng) {
        return ResponseEntity.ok(aiRiskService.analyzeThreat(lat, lng));
    }
}
