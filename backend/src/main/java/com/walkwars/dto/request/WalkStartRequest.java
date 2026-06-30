package com.walkwars.dto.request;

import lombok.Data;

import java.time.Instant;

@Data
public class WalkStartRequest {

    private Instant clientStartedAt;
}
