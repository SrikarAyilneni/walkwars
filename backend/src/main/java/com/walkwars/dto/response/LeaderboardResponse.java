package com.walkwars.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class LeaderboardResponse {

    private List<LeaderboardEntryResponse> content;
    private CurrentUserRankResponse currentUserRank;
    private int page;
    private int size;
    private long totalElements;
}
