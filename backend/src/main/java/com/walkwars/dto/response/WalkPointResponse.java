package com.walkwars.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class WalkPointResponse {

    private Integer sequenceNumber;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Instant timestamp;
}
