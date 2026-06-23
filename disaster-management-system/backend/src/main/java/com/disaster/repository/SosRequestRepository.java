package com.disaster.repository;

import com.disaster.model.SosRequest;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SosRequestRepository extends MongoRepository<SosRequest, String> {
}
