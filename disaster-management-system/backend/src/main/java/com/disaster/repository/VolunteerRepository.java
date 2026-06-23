package com.disaster.repository;

import com.disaster.model.Volunteer;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface VolunteerRepository extends MongoRepository<Volunteer, String> {
    List<Volunteer> findByStatus(Volunteer.VolunteerStatus status);

    @Query("{ 'geoLocation': { $nearSphere: { $geometry: { type: 'Point', coordinates: [ ?0, ?1 ] }, $maxDistance: ?2 } }, 'status': 'AVAILABLE' }")
    List<Volunteer> findAvailableVolunteersWithinRadius(double longitude, double latitude, double maxDistanceInMeters);
}
