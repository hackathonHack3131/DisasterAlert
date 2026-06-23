package com.disaster.repository;

import com.disaster.model.DisasterEvent;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface DisasterEventRepository extends MongoRepository<DisasterEvent, String> {
    List<DisasterEvent> findTop20ByOrderByTimestampDesc();
    List<DisasterEvent> findByActiveTrueOrderByTimestampDesc();
}

