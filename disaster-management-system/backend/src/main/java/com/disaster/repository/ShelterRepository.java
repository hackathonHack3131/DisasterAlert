package com.disaster.repository;

import com.disaster.model.Shelter;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface ShelterRepository extends MongoRepository<Shelter, String> {
    @Query("{ 'geoLocation': { $nearSphere: { $geometry: { type: 'Point', coordinates: [ ?0, ?1 ] }, $maxDistance: ?2 } } }")
    List<Shelter> findSheltersWithinRadius(double longitude, double latitude, double maxDistanceInMeters);
}
