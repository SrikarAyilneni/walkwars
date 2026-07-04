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

        gisRepository.updateWalkPath(
                walk.getId(),
                pathResult.pathWkt(),
                pathResult.distanceM(),
                durationSeconds,
                endTime
        );

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
                .build();
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
                .build();
    }
}
