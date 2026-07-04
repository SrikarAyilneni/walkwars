package com.walkwars.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
public class WalkImportRequest {

    @NotNull
    private Instant clientStartedAt;

    @NotNull
    private Instant clientEndedAt;

    @NotEmpty
    private List<WalkPointImportItem> points;
}
