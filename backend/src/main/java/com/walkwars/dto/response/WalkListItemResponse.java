package com.walkwars.dto.response;

import com.walkwars.entity.WalkStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class WalkListItemResponse {

    private Long id;
    private Instant startTime;
    private Instant endTime;
    private BigDecimal distanceMeters;
    private Integer durationSeconds;
    private WalkStatus status;
    private Integer caloriesBurnt;
}
