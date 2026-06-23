package com.disaster.config;

import com.disaster.model.*;
import com.disaster.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.GeospatialIndex;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final OrganisationRepository organisationRepository;
    private final ShelterRepository shelterRepository;
    private final VolunteerRepository volunteerRepository;
    private final PasswordEncoder passwordEncoder;
    private final MongoTemplate mongoTemplate;

    public DataSeeder(
            UserRepository userRepository,
            OrganisationRepository organisationRepository,
            ShelterRepository shelterRepository,
            VolunteerRepository volunteerRepository,
            PasswordEncoder passwordEncoder,
            MongoTemplate mongoTemplate) {
        this.userRepository = userRepository;
        this.organisationRepository = organisationRepository;
        this.shelterRepository = shelterRepository;
        this.volunteerRepository = volunteerRepository;
        this.passwordEncoder = passwordEncoder;
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void run(String... args) {
        // Ensure 2dsphere indexes compile.
        try {
            mongoTemplate.indexOps(User.class).ensureIndex(new GeospatialIndex("geoLocation").typed(org.springframework.data.mongodb.core.index.GeoSpatialIndexType.GEO_2DSPHERE));
            mongoTemplate.indexOps(Shelter.class).ensureIndex(new GeospatialIndex("geoLocation").typed(org.springframework.data.mongodb.core.index.GeoSpatialIndexType.GEO_2DSPHERE));
            mongoTemplate.indexOps(Volunteer.class).ensureIndex(new GeospatialIndex("geoLocation").typed(org.springframework.data.mongodb.core.index.GeoSpatialIndexType.GEO_2DSPHERE));
            mongoTemplate.indexOps(Organisation.class).ensureIndex(new GeospatialIndex("geoLocation").typed(org.springframework.data.mongodb.core.index.GeoSpatialIndexType.GEO_2DSPHERE));
            mongoTemplate.indexOps(DisasterEvent.class).ensureIndex(new GeospatialIndex("geoLocation").typed(org.springframework.data.mongodb.core.index.GeoSpatialIndexType.GEO_2DSPHERE));
            System.out.println("Programmatic 2dsphere index creation successful.");
        } catch (Exception e) {
            System.err.println("Could not create geospatial indexes programmatically: " + e.getMessage());
        }

        // 1. Seed Admin
        if (!userRepository.existsByUsername("admin")) {
            userRepository.save(User.builder()
                    .username("admin")
                    .email("admin@disaster.local")
                    .password(passwordEncoder.encode("admin123"))
                    .location("HQ")
                    .state("Delhi")
                    .city("New Delhi")
                    .role(UserRole.ADMIN)
                    .verified(true)
                    .latitude(28.6139)
                    .longitude(77.2090)
                    .geoLocation(GeoLocation.of(28.6139, 77.2090))
                    .createdAt(Instant.now())
                    .build());
        }

        // 2. Seed Test Citizen Users inside Mumbai region to receive disaster email alerts
        if (!userRepository.existsByEmail("gaurangchouhan316@gmail.com")) {
            User citizen1 = User.builder()
                    .username("gaurang")
                    .email("gaurangchouhan316@gmail.com")
                    .password(passwordEncoder.encode("user123"))
                    .location("Mumbai Central")
                    .state("Maharashtra")
                    .city("Mumbai")
                    .role(UserRole.CITIZEN)
                    .verified(true)
                    .latitude(19.0760)
                    .longitude(72.8777)
                    .geoLocation(GeoLocation.of(19.0760, 72.8777))
                    .createdAt(Instant.now())
                    .build();
            userRepository.save(citizen1);
        }

        if (!userRepository.existsByEmail("rathorenakul271@gmail.com")) {
            User citizen2 = User.builder()
                    .username("nakul")
                    .email("rathorenakul271@gmail.com")
                    .password(passwordEncoder.encode("user123"))
                    .location("Bandra Waterfront")
                    .state("Maharashtra")
                    .city("Mumbai")
                    .role(UserRole.CITIZEN)
                    .verified(true)
                    .latitude(19.0490)
                    .longitude(72.8130)
                    .geoLocation(GeoLocation.of(19.0490, 72.8130))
                    .createdAt(Instant.now())
                    .build();
            userRepository.save(citizen2);
        }

        // 3. Seed Organisation
        if (organisationRepository.count() == 0) {
            Organisation ngo = Organisation.builder()
                    .organisationName("Rapid Relief NGO")
                    .email("gaurangchouhan316@gmail.com")
                    .password(passwordEncoder.encode("org123"))
                    .verified(true)
                    .activeStatus(true)
                    .country("India")
                    .state("Maharashtra")
                    .city("Mumbai")
                    .description("Emergency food and shelter provider")
                    .supportTypes(List.of("Food", "Shelter", "Drinking Water", "Rescue Boats", "Evacuation Transport"))
                    .resourcesAvailable(List.of("Food", "Blankets", "Rescue Boats"))
                    .shelterCapacity(500)
                    .latitude(19.0760)
                    .longitude(72.8777)
                    .verificationBadge("VERIFIED")
                    .createdAt(Instant.now())
                    .build();
            ngo.syncGeo();
            organisationRepository.save(ngo);

            // 4. Seed Shelter
            Shelter shelter = Shelter.builder()
                    .name("Mumbai Central Relief Shelter")
                    .organisationId(ngo.getId())
                    .capacity(300)
                    .availableBeds(280)
                    .foodAvailable(true)
                    .medicalAvailable(true)
                    .latitude(19.0176)
                    .longitude(72.8562)
                    .contactDetails("+91-1800-RELief")
                    .status(Shelter.ShelterStatus.INACTIVE)
                    .build();
            shelter.syncGeo();
            shelterRepository.save(shelter);
        }

        // 5. Seed Volunteer
        if (volunteerRepository.count() == 0) {
            User volunteerUser = User.builder()
                    .username("mumbaivolunteer")
                    .email("volunteer@disaster.local")
                    .password(passwordEncoder.encode("user123"))
                    .location("Kurla")
                    .state("Maharashtra")
                    .city("Mumbai")
                    .role(UserRole.VOLUNTEER)
                    .verified(true)
                    .latitude(19.0728)
                    .longitude(72.8826)
                    .geoLocation(GeoLocation.of(19.0728, 72.8826))
                    .createdAt(Instant.now())
                    .build();
            userRepository.save(volunteerUser);

            Volunteer volunteer = Volunteer.builder()
                    .userId(volunteerUser.getId())
                    .status(Volunteer.VolunteerStatus.AVAILABLE)
                    .latitude(19.0728)
                    .longitude(72.8826)
                    .skills(List.of("First Aid", "Rescue Operations", "Drinking Water Supply"))
                    .build();
            volunteer.syncGeo();
            volunteerRepository.save(volunteer);
        }
    }
}
