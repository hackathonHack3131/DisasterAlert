package com.disaster.repository;

import com.disaster.model.Organisation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface OrganisationRepository extends MongoRepository<Organisation, String> {
    Optional<Organisation> findByEmail(String email);
    boolean existsByEmail(String email);
    List<Organisation> findByVerifiedTrueAndActiveStatusTrue();
}
