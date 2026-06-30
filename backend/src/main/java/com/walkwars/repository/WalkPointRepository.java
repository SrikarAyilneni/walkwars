package com.walkwars.repository;

import com.walkwars.entity.WalkPoint;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public interface WalkPointRepository extends JpaRepository<WalkPoint, Long> {

    int countByWalkId(Long walkId);

    List<WalkPoint> findByWalkIdOrderBySequenceNumberAsc(Long walkId, Pageable pageable);

    @Modifying
    @Query(value = """
        INSERT INTO walk_points (walk_id, latitude, longitude, timestamp, sequence_number, geom)
        VALUES (
            :walkId,
            round(CAST(:latitude AS numeric), 7),
            round(CAST(:longitude AS numeric), 7),
            :timestamp,
            :sequenceNumber,
            ST_SetSRID(ST_MakePoint(
                round(CAST(:longitude AS numeric), 7)::double precision,
                round(CAST(:latitude AS numeric), 7)::double precision
            ), 4326)
        )
        ON CONFLICT (walk_id, sequence_number) DO NOTHING
        """, nativeQuery = true)
    int insertPoint(
            @Param("walkId") Long walkId,
            @Param("latitude") BigDecimal latitude,
            @Param("longitude") BigDecimal longitude,
            @Param("timestamp") Instant timestamp,
            @Param("sequenceNumber") Integer sequenceNumber
    );
}
