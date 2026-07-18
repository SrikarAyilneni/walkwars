package com.walkwars.controller;

import com.walkwars.dto.response.ApiResponse;
import com.walkwars.dto.response.UserProfileResponse;
import com.walkwars.dto.response.UserResponse;
import com.walkwars.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuthHelper authHelper;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> me(Authentication auth) {
        Long userId = authHelper.getCurrentUserId(auth);
        return ResponseEntity.ok(ApiResponse.success(userService.getMe(userId)));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> profile(Authentication auth) {
        Long userId = authHelper.getCurrentUserId(auth);
        return ResponseEntity.ok(ApiResponse.success(userService.getProfile(userId)));
    }

    @org.springframework.web.bind.annotation.PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            Authentication auth,
            @org.springframework.web.bind.annotation.RequestBody com.walkwars.dto.request.UpdateProfileRequest request) {
        Long userId = authHelper.getCurrentUserId(auth);
        return ResponseEntity.ok(ApiResponse.success(userService.updateProfile(userId, request)));
    }
}
