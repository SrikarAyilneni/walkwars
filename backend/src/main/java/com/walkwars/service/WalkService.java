package com.walkwars.service;

import com.walkwars.dto.request.*;
import com.walkwars.dto.response.*;
import com.walkwars.entity.User;
import com.walkwars.entity.Walk;
import com.walkwars.entity.WalkPoint;
import com.walkwars.entity.WalkStatus;
import com.walkwars.exception.BusinessException;
import com.walkwars.config.WalkwarsProperties;
import com.walkwars.repository.GisRepository;
import com.walkwars.repository.UserRepository;
import com.walkwars.repository.WalkPointRepository;
import com.walkwars.repository.WalkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WalkService {

    private final WalkRepository walkRepository;
    private final WalkPointRepository walkPointRepository;
    private final UserRepository userRepository;
    private final GisRepository gisRepository;
    private final GisService gisService;
    private final TerritoryService territoryService;
    private final WalkwarsProperties properties;

    @Transactional
    public WalkStartResponse startWalk(User user, WalkStartRequest request) {
        walkRepository.findByUserIdAndStatus(user.getId(), WalkStatus.ACTIVE)
                .ifPresent(w -> {
                    throw new BusinessException("ACTIVE_WALK_EXISTS", "You already have an active walk");
                });

        Instant startTime = request != null && request.getClientStartedAt() != null
                ? request.getClientStartedAt()
                : Instant.now();

        Walk walk = Walk.builder()
                .user(user)
                .startTime(startTime)
                .status(WalkStatus.ACTIVE)
                .build();

        walk = walkRepository.save(walk);

        return WalkStartResponse.builder()
                .id(walk.getId())
                .status(walk.getStatus())
                .startTime(walk.getStartTime())
                .build();
    }

    @Transactional
    public PointAckResponse addPoint(Long userId, WalkPointRequest request) {
        Walk walk = findActiveWalkForUser(userId, request.getWalkId());

        if (request.getAccuracyMeters() != null && request.getAccuracyMeters() > 50) {
            return PointAckResponse.builder()
                    .walkId(walk.getId())
                    .sequenceNumber(request.getSequenceNumber())
                    .accepted(false)
                    .build();
        }

        walkPointRepository.insertPoint(
                walk.getId(),
                request.getLatitude(),
                request.getLongitude(),
                request.getTimestamp(),
                request.getSequenceNumber()
        );

        return PointAckResponse.builder()
                .walkId(walk.getId())
                .sequenceNumber(request.getSequenceNumber())
                .accepted(true)
                .build();
    }

    @Transactional
    public WalkSummaryResponse endWalk(Long userId, WalkEndRequest request) {
        Walk walk = findActiveWalkForUser(userId, request.getWalkId());
        int pointCount = walkPointRepository.countByWalkId(walk.getId());

        if (pointCount < properties.getMinPoints()) {
            throw new BusinessException("INSUFFICIENT_POINTS",
                    "At least " + properties.getMinPoints() + " points required to complete a walk");
        }

        GisRepository.WalkPathResult pathResult = gisRepository.buildWalkPath(walk.getId());

        if (pathResult.distanceM().compareTo(BigDecimal.valueOf(properties.getMinDistanceMeters())) < 0) {
            throw new BusinessException("VALIDATION_ERROR",
                    "Walk distance must be at least " + properties.getMinDistanceMeters() + " meters");
        }

        Instant endTime = request.getClientEndedAt() != null ? request.getClientEndedAt() : Instant.now();
        int durationSeconds = (int) (endTime.getEpochSecond() - walk.getStartTime().getEpochSecond());

        // Calculate speed in km/h
        double speedKmh = 0.0;
        if (durationSeconds > 0) {
            speedKmh = (pathResult.distanceM().doubleValue() / 1000.0) / (durationSeconds / 3600.0);
        }

        // Map speed to MET (Metabolic Equivalent of Task)
        double met = 3.5;
        if (speedKmh < 3.2) {
            met = 2.0;
        } else if (speedKmh < 4.5) {
            met = 3.0;
        } else if (speedKmh < 5.6) {
            met = 3.5;
        } else if (speedKmh < 6.4) {
            met = 4.3;
        } else {
            met = 5.0;
        }

        // Get user weight. Default to 70kg
        int weightKg = 70;
        User user = walk.getUser();
        if (user.getWeightKg() != null && user.getWeightKg() > 0) {
            weightKg = user.getWeightKg();
        }

        // Calculate calories burnt
        int caloriesBurnt = (int) Math.round(met * weightKg * (durationSeconds / 3600.0));

        gisRepository.updateWalkPath(
                walk.getId(),
                pathResult.pathWkt(),
                pathResult.distanceM(),
                durationSeconds,
                endTime,
                caloriesBurnt
        );

        // Update user daily walk streak if walk matches threshold
        // Threshold: distance >= 500m OR duration >= 5 minutes (300 seconds)
        boolean meetsStreakThreshold = pathResult.distanceM().compareTo(BigDecimal.valueOf(500)) >= 0
                || durationSeconds >= 300;

        if (meetsStreakThreshold) {
            updateUserStreak(user);
        }

        boolean territoryCreated = false;
        if (gisRepository.detectClosedLoop(walk.getId())) {
            territoryCreated = territoryService.createFromWalk(userId, walk.getId());
        }

        gisRepository.refreshLeaderboard();

        String geoJson = gisRepository.getPathGeoJson(walk.getId());
        Map<String, Object> pathGeoJson = gisService.parseGeoJson(geoJson);

        return WalkSummaryResponse.builder()
                .id(walk.getId())
                .startTime(walk.getStartTime())
                .endTime(endTime)
                .distanceMeters(pathResult.distanceM())
                .durationSeconds(durationSeconds)
                .pointCount(pointCount)
                .pathGeoJson(pathGeoJson)
                .territoryCreated(territoryCreated)
                .caloriesBurnt(caloriesBurnt)
                .build();
    }

    private void updateUserStreak(User user) {
        java.time.LocalDate today = java.time.LocalDate.now(java.time.ZoneOffset.UTC);
        java.time.LocalDate lastWalkDate = user.getLastWalkDate();

        if (lastWalkDate == null) {
            user.setStreakCount(1);
            user.setLastWalkDate(today);
        } else if (lastWalkDate.equals(today)) {
            // Already walked today, streak remains unchanged
        } else if (lastWalkDate.plusDays(1).equals(today)) {
            user.setStreakCount(user.getStreakCount() + 1);
            user.setLastWalkDate(today);
        } else {
            user.setStreakCount(1);
            user.setLastWalkDate(today);
        }
        userRepository.save(user);
    }

    public PageResponse<WalkListItemResponse> listWalks(Long userId, int page, int size, WalkStatus status) {
        int pageSize = Math.min(size, 50);
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<Walk> walks = walkRepository.findByUserIdAndStatusOrderByStartTimeDesc(userId, status, pageable);

        List<WalkListItemResponse> content = walks.getContent().stream()
                .map(this::toListItem)
                .toList();

        return PageResponse.<WalkListItemResponse>builder()
                .content(content)
                .page(page)
                .size(pageSize)
                .totalElements(walks.getTotalElements())
                .totalPages(walks.getTotalPages())
                .build();
    }

    public WalkDetailResponse getWalk(Long userId, Long walkId) {
        Walk walk = walkRepository.findByIdAndUserId(walkId, userId)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Walk not found"));

        if (walk.getStatus() != WalkStatus.COMPLETED) {
            throw new BusinessException("NOT_FOUND", "Walk not found");
        }

        String geoJson = gisRepository.getPathGeoJson(walkId);
        Map<String, Object> pathGeoJson = gisService.parseGeoJson(geoJson);
        BoundsResponse bounds = null;

        try {
            Object[] boundsRow = gisRepository.getPathBounds(walkId);
            if (boundsRow != null) {
                bounds = gisService.calculateBoundsFromDb(
                        ((Number) boundsRow[0]).doubleValue(),
                        ((Number) boundsRow[1]).doubleValue(),
                        ((Number) boundsRow[2]).doubleValue(),
                        ((Number) boundsRow[3]).doubleValue()
                );
            }
        } catch (Exception ignored) {
            bounds = gisService.calculateBounds(pathGeoJson);
        }

        return WalkDetailResponse.builder()
                .id(walk.getId())
                .startTime(walk.getStartTime())
                .endTime(walk.getEndTime())
                .distanceMeters(walk.getDistanceMeters())
                .durationSeconds(walk.getDurationSeconds())
                .status(walk.getStatus())
                .pathGeoJson(pathGeoJson)
                .bounds(bounds)
                .caloriesBurnt(walk.getCaloriesBurnt())
                .build();
    }

    public List<WalkPointResponse> getPoints(Long userId, Long walkId, int page, int size) {
        walkRepository.findByIdAndUserId(walkId, userId)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Walk not found"));

        Pageable pageable = PageRequest.of(page, Math.min(size, 1000));
        List<WalkPoint> points = walkPointRepository.findByWalkIdOrderBySequenceNumberAsc(walkId, pageable);

        return points.stream()
                .map(p -> WalkPointResponse.builder()
                        .sequenceNumber(p.getSequenceNumber())
                        .latitude(p.getLatitude())
                        .longitude(p.getLongitude())
                        .timestamp(p.getTimestamp())
                        .build())
                .toList();
    }

    @Transactional
    public WalkSummaryResponse importWalk(User user, WalkImportRequest request) {
        // Delete any existing active walk for this user to avoid unique constraint violations
        walkRepository.findByUserIdAndStatus(user.getId(), WalkStatus.ACTIVE)
                .ifPresent(w -> {
                    walkRepository.delete(w);
                    walkRepository.flush(); // Force Hibernate to execute SQL DELETE before executing subsequent SQL INSERT
                });

        Walk walk = Walk.builder()
                .user(user)
                .startTime(request.getClientStartedAt())
                .status(WalkStatus.ACTIVE)
                .build();
        walk = walkRepository.save(walk);

        for (WalkPointImportItem point : request.getPoints()) {
            if (point.getAccuracyMeters() != null && point.getAccuracyMeters() > 50) {
                continue;
            }
            walkPointRepository.insertPoint(
                    walk.getId(),
                    point.getLatitude(),
                    point.getLongitude(),
                    point.getTimestamp(),
                    point.getSequenceNumber()
            );
        }

        WalkEndRequest endRequest = new WalkEndRequest();
        endRequest.setWalkId(walk.getId());
        endRequest.setClientEndedAt(request.getClientEndedAt());

        return this.endWalk(user.getId(), endRequest);
    }

    private Walk findActiveWalkForUser(Long userId, Long walkId) {
        Walk walk = walkRepository.findByIdAndUserId(walkId, userId)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Walk not found"));

        if (walk.getStatus() != WalkStatus.ACTIVE) {
            throw new BusinessException("NO_ACTIVE_WALK", "Walk is not active");
        }
        return walk;
    }

    private WalkListItemResponse toListItem(Walk walk) {
        return WalkListItemResponse.builder()
                .id(walk.getId())
                .startTime(walk.getStartTime())
                .endTime(walk.getEndTime())
                .distanceMeters(walk.getDistanceMeters())
                .durationSeconds(walk.getDurationSeconds())
                .status(walk.getStatus())
                .caloriesBurnt(walk.getCaloriesBurnt())
                .build();
    }
}
