package com.disaster.repository;

import com.disaster.model.RescueRequest;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface RescueRequestRepository extends MongoRepository<RescueRequest, String> {
    List<RescueRequest> findByStatus(RescueRequest.RescueStatus status);
}
