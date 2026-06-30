package com.walkwars.controller;

import com.walkwars.dto.request.WalkEndRequest;
import com.walkwars.dto.request.WalkPointRequest;
import com.walkwars.dto.request.WalkStartRequest;
import com.walkwars.dto.response.*;
import com.walkwars.entity.WalkStatus;
import com.walkwars.entity.User;
import com.walkwars.service.WalkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/walks")
@RequiredArgsConstructor
public class WalkController {

    private final WalkService walkService;
    private final AuthHelper authHelper;

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<WalkStartResponse>> start(
            Authentication auth,
            @RequestBody(required = false) WalkStartRequest request) {
        User user = authHelper.getCurrentUser(auth);
        WalkStartResponse response = walkService.startWalk(user, request);
        return ResponseEntity.ok(ApiResponse.success("Walk started", response));
    }

    @PostMapping("/point")
    public ResponseEntity<ApiResponse<PointAckResponse>> addPoint(
            @Valid @RequestBody WalkPointRequest request,
            Authentication auth) {
        Long userId = authHelper.getCurrentUserId(auth);
        PointAckResponse response = walkService.addPoint(userId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/end")
    public ResponseEntity<ApiResponse<WalkSummaryResponse>> end(
            @Valid @RequestBody WalkEndRequest request,
            Authentication auth) {
        Long userId = authHelper.getCurrentUserId(auth);
        WalkSummaryResponse response = walkService.endWalk(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Walk completed", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<WalkListItemResponse>>> list(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "COMPLETED") WalkStatus status) {
        Long userId = authHelper.getCurrentUserId(auth);
        PageResponse<WalkListItemResponse> response = walkService.listWalks(userId, page, size, status);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WalkDetailResponse>> get(
            @PathVariable Long id,
            Authentication auth) {
        Long userId = authHelper.getCurrentUserId(auth);
        WalkDetailResponse response = walkService.getWalk(userId, id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/points")
    public ResponseEntity<ApiResponse<List<WalkPointResponse>>> points(
            @PathVariable Long id,
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "1000") int size) {
        Long userId = authHelper.getCurrentUserId(auth);
        List<WalkPointResponse> response = walkService.getPoints(userId, id, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
