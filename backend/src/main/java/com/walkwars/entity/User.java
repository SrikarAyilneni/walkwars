package com.walkwars.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "height_cm")
    private Integer heightCm;

    @Column(name = "weight_kg")
    private Integer weightKg;

    @Column(name = "age")
    private Integer age;

    @Column(name = "streak_count", nullable = false)
    @Builder.Default
    private Integer streakCount = 0;

    @Column(name = "last_walk_date")
    private java.time.LocalDate lastWalkDate;

    @Column(name = "daily_step_goal", nullable = false)
    @Builder.Default
    private Integer dailyStepGoal = 10000;

    @Column(name = "daily_calorie_goal", nullable = false)
    @Builder.Default
    private Integer dailyCalorieGoal = 300;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (streakCount == null) {
            streakCount = 0;
        }
        if (dailyStepGoal == null) {
            dailyStepGoal = 10000;
        }
        if (dailyCalorieGoal == null) {
            dailyCalorieGoal = 300;
        }
    }
}
