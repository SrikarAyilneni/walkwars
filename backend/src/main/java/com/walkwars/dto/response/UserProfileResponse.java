package com.walkwars.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class UserProfileResponse {

    private Long id;
    private String username;
    private Instant memberSince;
    private UserStatsResponse stats;
}
