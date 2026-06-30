package com.walkwars.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class CurrentUserRankResponse {

    private int rank;
    private BigDecimal totalDistanceMeters;
}
