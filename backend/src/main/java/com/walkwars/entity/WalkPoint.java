package com.walkwars.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "walk_points")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalkPoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "walk_id", nullable = false)
    private Long walkId;

    private BigDecimal latitude;

    private BigDecimal longitude;

  @Column(nullable = false)
    private Instant timestamp;

    @Column(name = "sequence_number", nullable = false)
    private Integer sequenceNumber;
}
