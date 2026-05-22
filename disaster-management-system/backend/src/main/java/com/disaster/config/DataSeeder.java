package com.disaster.config;

import com.disaster.model.*;
import com.disaster.repository.OrganisationRepository;
import com.disaster.repository.ShelterRepository;
import com.disaster.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final OrganisationRepository organisationRepository;
    private final ShelterRepository shelterRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            UserRepository userRepository,
            OrganisationRepository organisationRepository,
            ShelterRepository shelterRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.organisationRepository = organisationRepository;
        this.shelterRepository = shelterRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
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
                    .createdAt(Instant.now())
                    .build());
        }

        if (organisationRepository.count() == 0) {
            Organisation ngo = Organisation.builder()
                    .organisationName("Rapid Relief NGO")
                    .email("relief@demo.org")
                    .password(passwordEncoder.encode("org123"))
                    .verified(true)
                    .activeStatus(true)
                    .country("India")
                    .state("Maharashtra")
                    .city("Mumbai")
                    .description("Emergency food and shelter provider")
                    .supportTypes(List.of("Food", "Shelter", "Drinking Water"))
                    .resourcesAvailable(List.of("Food", "Blankets"))
                    .shelterCapacity(500)
                    .latitude(19.0760)
                    .longitude(72.8777)
                    .verificationBadge("VERIFIED")
                    .createdAt(Instant.now())
                    .build();
            ngo.syncGeo();
            organisationRepository.save(ngo);

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
    }
}
