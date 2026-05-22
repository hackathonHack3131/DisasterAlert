package com.disaster.dto;

import com.disaster.model.Organisation;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class OrganisationCard {
    private String id;
    private String organisationName;
    private String logoUrl;
    private String state;
    private String city;
    private List<String> supportTypes;
    private boolean activeStatus;
    private String verificationBadge;

    public static OrganisationCard from(Organisation o) {
        return OrganisationCard.builder()
                .id(o.getId())
                .organisationName(o.getOrganisationName())
                .logoUrl(o.getLogoUrl())
                .state(o.getState())
                .city(o.getCity())
                .supportTypes(o.getSupportTypes())
                .activeStatus(o.isActiveStatus())
                .verificationBadge(o.getVerificationBadge())
                .build();
    }
}
