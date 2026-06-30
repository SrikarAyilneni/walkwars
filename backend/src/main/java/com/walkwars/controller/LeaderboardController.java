package com.walkwars.controller;

import com.walkwars.dto.response.ApiResponse;
import com.walkwars.dto.response.LeaderboardResponse;
import com.walkwars.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;
    private final AuthHelper authHelper;

    @GetMapping
    public ResponseEntity<ApiResponse<LeaderboardResponse>> getLeaderboard(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Long userId = authHelper.getCurrentUserId(auth);
        LeaderboardResponse response = leaderboardService.getLeaderboard(page, size, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
