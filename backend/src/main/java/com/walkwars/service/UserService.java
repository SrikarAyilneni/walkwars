package com.walkwars.service;

import com.walkwars.dto.response.UserProfileResponse;
import com.walkwars.dto.response.UserResponse;
import com.walkwars.dto.response.UserStatsResponse;
import com.walkwars.entity.User;
import com.walkwars.exception.BusinessException;
import com.walkwars.repository.UserRepository;
import com.walkwars.repository.UserStatsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserStatsRepository userStatsRepository;

    public UserResponse getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "User not found"));
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public UserProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "User not found"));

        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .memberSince(user.getCreatedAt())
                .stats(getStats(userId))
                .build();
    }

    public UserStatsResponse getStats(Long userId) {
        return UserStatsResponse.builder()
                .totalDistanceMeters(userStatsRepository.getTotalDistance(userId))
                .totalDurationSeconds(userStatsRepository.getTotalDurationSeconds(userId))
                .walkCount(userStatsRepository.getWalkCount(userId))
                .build();
    }
}
