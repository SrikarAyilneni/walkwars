package com.walkwars.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;

@Data
public class WalkEndRequest {

    @NotNull
    private Long walkId;

    private Instant clientEndedAt;
}
