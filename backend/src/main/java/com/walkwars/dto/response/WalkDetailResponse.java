package com.walkwars.dto.response;

import com.walkwars.entity.WalkStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class WalkDetailResponse {

    private Long id;
    private Instant startTime;
    private Instant endTime;
    private BigDecimal distanceMeters;
    private Integer durationSeconds;
    private WalkStatus status;
    private Map<String, Object> pathGeoJson;
    private BoundsResponse bounds;
}
