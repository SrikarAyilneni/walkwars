package com.walkwars.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

@Data
@Builder
public class WalkSummaryResponse {

    private Long id;
    private Instant startTime;
    private Instant endTime;
    private BigDecimal distanceMeters;
    private Integer durationSeconds;
    private int pointCount;
    private Map<String, Object> pathGeoJson;
    private boolean territoryCreated;
}
