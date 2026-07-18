package com.walkwars.dto.request;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private Integer heightCm;
    private Integer weightKg;
    private Integer age;
    private Integer dailyStepGoal;
    private Integer dailyCalorieGoal;
}
