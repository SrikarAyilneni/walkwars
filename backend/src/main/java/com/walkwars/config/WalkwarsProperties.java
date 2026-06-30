package com.walkwars.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class WalkwarsProperties {

    @Value("${walkwars.jwt.secret}")
    private String jwtSecret;

    @Value("${walkwars.jwt.expiration-ms}")
    private long jwtExpirationMs;

    @Value("${walkwars.cors.allowed-origins}")
    private String corsAllowedOrigins;

    @Value("${walkwars.walk.min-points}")
    private int minPoints;

    @Value("${walkwars.walk.min-distance-meters}")
    private double minDistanceMeters;
}
