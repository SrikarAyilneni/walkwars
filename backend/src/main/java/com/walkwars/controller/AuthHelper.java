package com.walkwars.controller;

import com.walkwars.entity.User;
import com.walkwars.exception.BusinessException;
import com.walkwars.security.JwtTokenProvider;
import com.walkwars.security.UserDetailsServiceImpl;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
public class AuthHelper {

    private final UserDetailsServiceImpl userDetailsService;
    private final JwtTokenProvider tokenProvider;

    public AuthHelper(UserDetailsServiceImpl userDetailsService, JwtTokenProvider tokenProvider) {
        this.userDetailsService = userDetailsService;
        this.tokenProvider = tokenProvider;
    }

    public User getCurrentUser(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new BusinessException("UNAUTHORIZED", "Not authenticated");
        }
        return userDetailsService.loadEntityByUsername(auth.getName());
    }

    public Long getCurrentUserId(Authentication auth) {
        return getCurrentUser(auth).getId();
    }
}
