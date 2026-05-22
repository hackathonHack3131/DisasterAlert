package com.disaster.integration;

import com.disaster.model.DisasterEvent;
import com.disaster.model.DisasterType;
import com.disaster.model.EventSource;
import com.disaster.service.EventProcessorService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
public class NasaFirmsService {

    private static final Logger log = LoggerFactory.getLogger(NasaFirmsService.class);

    private final RestTemplate restTemplate = new RestTemplate();
    private final EventProcessorService eventProcessor;

    @Value("${app.nasa-firms.map-key:}")
    private String mapKey;

    @Value("${app.integrations.auto-ingest:false}")
    private boolean autoIngest;

    public NasaFirmsService(EventProcessorService eventProcessor) {
        this.eventProcessor = eventProcessor;
    }

    /** India bounding box: west,south,east,north */
    public List<String> fetchFireCsv() {
        if (mapKey == null || mapKey.isBlank()) {
            return List.of();
        }
        String url = String.format(
                "https://firms.modaps.eosdis.nasa.gov/api/area/csv/VIIRS_SNPP_NRT/%s/68,8,97,37/1",
                mapKey);
        try {
            String csv = restTemplate.getForObject(url, String.class);
            if (csv == null) return List.of();
            return csv.lines().skip(1).limit(10).toList();
        } catch (Exception e) {
            log.error("NASA FIRMS fetch failed: {}", e.getMessage());
            return List.of();
        }
    }

    @Scheduled(fixedRate = 3_600_000, initialDelay = 120_000)
    public void pollFires() {
        if (!autoIngest) return;
        List<String> lines = fetchFireCsv();
        if (lines.isEmpty()) return;

        String first = lines.get(0);
        String[] parts = first.split(",");
        if (parts.length < 2) return;

        try {
            double lat = Double.parseDouble(parts[0].trim());
            double lng = Double.parseDouble(parts[1].trim());
            DisasterEvent event = DisasterEvent.builder()
                    .disasterType(DisasterType.FIRE)
                    .severity(8)
                    .location("NASA FIRMS active fire detection, India")
                    .latitude(lat)
                    .longitude(lng)
                    .timestamp(Instant.now())
                    .message("NASA FIRMS: Active fire hotspot detected in monitored region")
                    .affectedRadius(15)
                    .source(EventSource.FIRMS)
                    .build();
            eventProcessor.processEvent(event);
            log.info("Ingested NASA FIRMS fire event at {},{}", lat, lng);
        } catch (NumberFormatException e) {
            log.debug("Could not parse FIRMS line: {}", first);
        }
    }

    public Map<String, Object> status() {
        return Map.of(
                "configured", mapKey != null && !mapKey.isBlank(),
                "sampleRows", fetchFireCsv().size()
        );
    }
}
