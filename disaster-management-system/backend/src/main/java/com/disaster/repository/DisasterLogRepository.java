package com.disaster.repository;

import com.disaster.model.DisasterLog;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface DisasterLogRepository extends MongoRepository<DisasterLog, String> {
    List<DisasterLog> findByActiveTrueOrderByTimestampDesc();
}
