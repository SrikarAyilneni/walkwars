package com.walkwars.service;

import com.walkwars.dto.response.CurrentUserRankResponse;
import com.walkwars.dto.response.LeaderboardEntryResponse;
import com.walkwars.dto.response.LeaderboardResponse;
import com.walkwars.repository.LeaderboardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final LeaderboardRepository leaderboardRepository;

    public LeaderboardResponse getLeaderboard(int page, int size, Long currentUserId) {
        int pageSize = Math.min(size, 100);
        int offset = page * pageSize;

        List<LeaderboardRepository.LeaderboardRow> rows = leaderboardRepository.getLeaderboard(offset, pageSize);
        long total = leaderboardRepository.countUsers();

        List<LeaderboardEntryResponse> content = new ArrayList<>();
        for (int i = 0; i < rows.size(); i++) {
            LeaderboardRepository.LeaderboardRow row = rows.get(i);
            content.add(LeaderboardEntryResponse.builder()
                    .rank(offset + i + 1)
                    .userId(row.userId())
                    .username(row.username())
                    .totalDistanceMeters(row.totalDistanceMeters())
                    .walkCount(row.walkCount())
                    .build());
        }

        CurrentUserRankResponse currentUserRank = null;
        try {
            LeaderboardRepository.LeaderboardRow userRow = leaderboardRepository.getUserRank(currentUserId);
            currentUserRank = CurrentUserRankResponse.builder()
                    .rank(userRow.rank())
                    .totalDistanceMeters(userRow.totalDistanceMeters())
                    .build();
        } catch (Exception ignored) {
            // User may not be on leaderboard yet
        }

        return LeaderboardResponse.builder()
                .content(content)
                .currentUserRank(currentUserRank)
                .page(page)
                .size(pageSize)
                .totalElements(total)
                .build();
    }
}
