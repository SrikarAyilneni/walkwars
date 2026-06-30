package com.walkwars.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class UserStatsResponse {

    private BigDecimal totalDistanceMeters;
    private long totalDurationSeconds;
    private long walkCount;
}
