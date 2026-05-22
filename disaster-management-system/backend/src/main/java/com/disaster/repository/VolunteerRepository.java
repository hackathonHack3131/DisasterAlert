package com.disaster.repository;

import com.disaster.model.Volunteer;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface VolunteerRepository extends MongoRepository<Volunteer, String> {
    List<Volunteer> findByStatus(Volunteer.VolunteerStatus status);
}
