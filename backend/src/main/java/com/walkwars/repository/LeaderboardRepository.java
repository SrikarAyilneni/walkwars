package com.walkwars.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Repository
public class LeaderboardRepository {

    @PersistenceContext
    private EntityManager entityManager;

  @SuppressWarnings("unchecked")
    public List<LeaderboardRow> getLeaderboard(int offset, int limit) {
        List<Object[]> rows = entityManager.createNativeQuery("""
                SELECT user_id, username, total_distance_meters, walk_count
                FROM mv_leaderboard
                ORDER BY total_distance_meters DESC
                LIMIT :limit OFFSET :offset
                """)
                .setParameter("limit", limit)
                .setParameter("offset", offset)
                .getResultList();

        List<LeaderboardRow> result = new ArrayList<>();
        for (Object[] row : rows) {
            result.add(new LeaderboardRow(
                    ((Number) row[0]).longValue(),
                    (String) row[1],
                    (BigDecimal) row[2],
                    ((Number) row[3]).longValue()
            ));
        }
        return result;
    }

    public long countUsers() {
        Number count = (Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM mv_leaderboard").getSingleResult();
        return count.longValue();
    }

    public LeaderboardRow getUserRank(Long userId) {
        Object[] row = (Object[]) entityManager.createNativeQuery("""
                SELECT user_id, username, total_distance_meters, walk_count,
                       (SELECT COUNT(*) + 1 FROM mv_leaderboard m2
                        WHERE m2.total_distance_meters > m1.total_distance_meters) AS rank
                FROM mv_leaderboard m1
                WHERE user_id = :userId
                """)
                .setParameter("userId", userId)
                .getSingleResult();

        return new LeaderboardRow(
                ((Number) row[0]).longValue(),
                (String) row[1],
                (BigDecimal) row[2],
                ((Number) row[3]).longValue(),
                ((Number) row[4]).intValue()
        );
    }

    public record LeaderboardRow(Long userId, String username, BigDecimal totalDistanceMeters,
                                 long walkCount, int rank) {

        public LeaderboardRow(Long userId, String username, BigDecimal totalDistanceMeters, long walkCount) {
            this(userId, username, totalDistanceMeters, walkCount, 0);
        }
    }
}
