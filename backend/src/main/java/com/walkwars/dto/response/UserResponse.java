package com.walkwars.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class UserResponse {

    private Long id;
    private String username;
    private String email;
    private Instant createdAt;
}
