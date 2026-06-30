package com.walkwars.repository;

import com.walkwars.entity.Walk;
import com.walkwars.entity.WalkStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WalkRepository extends JpaRepository<Walk, Long> {

    Optional<Walk> findByUserIdAndStatus(Long userId, WalkStatus status);

    Optional<Walk> findByIdAndUserId(Long id, Long userId);

    Page<Walk> findByUserIdAndStatusOrderByStartTimeDesc(Long userId, WalkStatus status, Pageable pageable);
}
