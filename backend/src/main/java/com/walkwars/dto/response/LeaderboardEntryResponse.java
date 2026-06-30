package com.walkwars.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class LeaderboardEntryResponse {

    private int rank;
    private Long userId;
    private String username;
    private BigDecimal totalDistanceMeters;
    private long walkCount;
}
