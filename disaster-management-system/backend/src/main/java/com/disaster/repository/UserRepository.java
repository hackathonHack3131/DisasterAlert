package com.disaster.repository;

import com.disaster.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    List<User> findByStateAndCity(String state, String city);

    @Query("{ 'geoLocation': { $nearSphere: { $geometry: { type: 'Point', coordinates: [ ?0, ?1 ] }, $maxDistance: ?2 } } }")
    List<User> findUsersWithinRadius(double longitude, double latitude, double maxDistanceInMeters);

    @Query("{ 'geoLocation': { $nearSphere: { $geometry: { type: 'Point', coordinates: [ ?0, ?1 ] }, $maxDistance: ?2 } }, 'role': 'VOLUNTEER' }")
    List<User> findVolunteersWithinRadius(double longitude, double latitude, double maxDistanceInMeters);
}
