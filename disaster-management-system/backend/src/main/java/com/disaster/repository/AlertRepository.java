package com.disaster.repository;

import com.disaster.model.Alert;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface AlertRepository extends MongoRepository<Alert, String> {
    List<Alert> findTop20ByOrderByTimestampDesc();
}
