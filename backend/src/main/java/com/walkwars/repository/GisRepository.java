package com.walkwars.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;

@Repository
public class GisRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public WalkPathResult buildWalkPath(Long walkId) {
        Object[] row = (Object[]) entityManager.createNativeQuery(
                "SELECT ST_AsText(path_geom), distance_m FROM fn_build_walk_path(:walkId)")
                .setParameter("walkId", walkId)
                .getSingleResult();
        return new WalkPathResult((String) row[0], (BigDecimal) row[1]);
    }

    public boolean detectClosedLoop(Long walkId) {
        Boolean result = (Boolean) entityManager.createNativeQuery(
                "SELECT fn_detect_closed_loop(:walkId)")
                .setParameter("walkId", walkId)
                .getSingleResult();
        return Boolean.TRUE.equals(result);
    }

    public void updateWalkPath(Long walkId, String pathWkt, BigDecimal distanceMeters,
                               int durationSeconds, Instant endTime, Integer caloriesBurnt) {
        entityManager.createNativeQuery("""
                UPDATE walks SET
                    path = ST_GeomFromText(:pathWkt, 4326),
                    distance_meters = :distance,
                    duration_seconds = :duration,
                    end_time = :endTime,
                    calories_burnt = :caloriesBurnt,
                    status = 'COMPLETED'
                WHERE id = :walkId AND status = 'ACTIVE'
                """)
                .setParameter("pathWkt", pathWkt)
                .setParameter("distance", distanceMeters)
                .setParameter("duration", durationSeconds)
                .setParameter("endTime", endTime)
                .setParameter("caloriesBurnt", caloriesBurnt)
                .setParameter("walkId", walkId)
                .executeUpdate();
    }

    public String getPathGeoJson(Long walkId) {
        return (String) entityManager.createNativeQuery(
                "SELECT ST_AsGeoJSON(path) FROM walks WHERE id = :walkId")
                .setParameter("walkId", walkId)
                .getSingleResult();
    }

    public Object[] getPathBounds(Long walkId) {
        return (Object[]) entityManager.createNativeQuery("""
                SELECT
                    ST_YMin(path), ST_XMin(path),
                    ST_YMax(path), ST_XMax(path)
                FROM walks WHERE id = :walkId AND path IS NOT NULL
                """)
                .setParameter("walkId", walkId)
                .getSingleResult();
    }

    public TerritoryPolygonResult createTerritoryPolygon(Long walkId) {
        Object[] row = (Object[]) entityManager.createNativeQuery(
                "SELECT ST_AsText(polygon_geom), area_sq_m FROM fn_create_territory_polygon(:walkId)")
                .setParameter("walkId", walkId)
                .getSingleResult();
        return new TerritoryPolygonResult((String) row[0], (BigDecimal) row[1]);
    }

    public void insertTerritory(Long userId, Long walkId, String polygonWkt, BigDecimal areaSqMeters) {
        entityManager.createNativeQuery("""
                INSERT INTO territories (user_id, walk_id, polygon, area_sq_meters)
                VALUES (:userId, :walkId, ST_GeomFromText(:polygonWkt, 4326), :area)
                """)
                .setParameter("userId", userId)
                .setParameter("walkId", walkId)
                .setParameter("polygonWkt", polygonWkt)
                .setParameter("area", areaSqMeters)
                .executeUpdate();
    }

    public void refreshLeaderboard() {
        entityManager.createNativeQuery("REFRESH MATERIALIZED VIEW mv_leaderboard").executeUpdate();
    }

    public record WalkPathResult(String pathWkt, BigDecimal distanceM) {}

    public record TerritoryPolygonResult(String polygonWkt, BigDecimal areaSqM) {}
}
