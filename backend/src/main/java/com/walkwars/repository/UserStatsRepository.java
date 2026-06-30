package com.walkwars.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public class UserStatsRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public BigDecimal getTotalDistance(Long userId) {
        BigDecimal result = (BigDecimal) entityManager.createNativeQuery(
                "SELECT fn_user_total_distance(:userId)")
                .setParameter("userId", userId)
                .getSingleResult();
        return result != null ? result : BigDecimal.ZERO;
    }

    public long getTotalDurationSeconds(Long userId) {
        Number result = (Number) entityManager.createNativeQuery("""
                SELECT COALESCE(SUM(duration_seconds), 0)
                FROM walks WHERE user_id = :userId AND status = 'COMPLETED'
                """)
                .setParameter("userId", userId)
                .getSingleResult();
        return result.longValue();
    }

    public long getWalkCount(Long userId) {
        Number result = (Number) entityManager.createNativeQuery("""
                SELECT COUNT(*) FROM walks
                WHERE user_id = :userId AND status = 'COMPLETED'
                """)
                .setParameter("userId", userId)
                .getSingleResult();
        return result.longValue();
    }
}
