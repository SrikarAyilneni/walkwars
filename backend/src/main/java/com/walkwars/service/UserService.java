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
        checkAndResetStreak(user);
        return mapToUserResponse(user);
    }

    public UserProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "User not found"));
        checkAndResetStreak(user);

        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .memberSince(user.getCreatedAt())
                .heightCm(user.getHeightCm())
                .weightKg(user.getWeightKg())
                .age(user.getAge())
                .streakCount(user.getStreakCount())
                .dailyStepGoal(user.getDailyStepGoal())
                .dailyCalorieGoal(user.getDailyCalorieGoal())
                .stats(getStats(userId))
                .build();
    }

    @org.springframework.transaction.annotation.Transactional
    public UserResponse updateProfile(Long userId, com.walkwars.dto.request.UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "User not found"));

        if (request.getHeightCm() != null) user.setHeightCm(request.getHeightCm());
        if (request.getWeightKg() != null) user.setWeightKg(request.getWeightKg());
        if (request.getAge() != null) user.setAge(request.getAge());
        if (request.getDailyStepGoal() != null) user.setDailyStepGoal(request.getDailyStepGoal());
        if (request.getDailyCalorieGoal() != null) user.setDailyCalorieGoal(request.getDailyCalorieGoal());

        user = userRepository.save(user);
        return mapToUserResponse(user);
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .heightCm(user.getHeightCm())
                .weightKg(user.getWeightKg())
                .age(user.getAge())
                .streakCount(user.getStreakCount())
                .dailyStepGoal(user.getDailyStepGoal())
                .dailyCalorieGoal(user.getDailyCalorieGoal())
                .build();
    }

    private void checkAndResetStreak(User user) {
        if (user.getLastWalkDate() != null) {
            java.time.LocalDate today = java.time.LocalDate.now(java.time.ZoneOffset.UTC);
            if (!user.getLastWalkDate().equals(today) && !user.getLastWalkDate().plusDays(1).equals(today)) {
                user.setStreakCount(0);
                userRepository.save(user);
            }
        }
    }

    public UserStatsResponse getStats(Long userId) {
        return UserStatsResponse.builder()
                .totalDistanceMeters(userStatsRepository.getTotalDistance(userId))
                .totalDurationSeconds(userStatsRepository.getTotalDurationSeconds(userId))
                .walkCount(userStatsRepository.getWalkCount(userId))
                .build();
    }
}
