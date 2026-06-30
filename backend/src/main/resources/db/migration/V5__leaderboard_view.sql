CREATE MATERIALIZED VIEW mv_leaderboard AS
SELECT
    u.id AS user_id,
    u.username,
    COALESCE(SUM(w.distance_meters), 0) AS total_distance_meters,
    COUNT(w.id) AS walk_count
FROM users u
LEFT JOIN walks w ON w.user_id = u.id AND w.status = 'COMPLETED'
GROUP BY u.id, u.username
ORDER BY total_distance_meters DESC;

CREATE UNIQUE INDEX idx_mv_leaderboard_user ON mv_leaderboard (user_id);
