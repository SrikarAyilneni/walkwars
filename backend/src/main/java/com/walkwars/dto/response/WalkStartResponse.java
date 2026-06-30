package com.walkwars.dto.response;

import com.walkwars.entity.WalkStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class WalkStartResponse {

    private Long id;
    private WalkStatus status;
    private Instant startTime;
}
