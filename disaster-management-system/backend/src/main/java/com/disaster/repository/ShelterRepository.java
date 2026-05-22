package com.disaster.repository;

import com.disaster.model.Shelter;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ShelterRepository extends MongoRepository<Shelter, String> {
}
