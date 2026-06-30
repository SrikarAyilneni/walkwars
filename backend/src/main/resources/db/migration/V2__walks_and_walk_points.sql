CREATE TYPE walk_status AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

CREATE TABLE walks (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    end_time          TIMESTAMPTZ,
    distance_meters   NUMERIC(12,2),
    duration_seconds  INTEGER,
    path              GEOMETRY(LINESTRING, 4326),
    status            walk_status  NOT NULL DEFAULT 'ACTIVE',
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_walk_completed_fields CHECK (
        status != 'COMPLETED' OR (
            end_time IS NOT NULL
            AND distance_meters IS NOT NULL
            AND duration_seconds IS NOT NULL
            AND path IS NOT NULL
        )
    )
);

CREATE INDEX idx_walks_user_id ON walks (user_id);
CREATE INDEX idx_walks_user_status ON walks (user_id, status);
CREATE INDEX idx_walks_path_gist ON walks USING GIST (path);

CREATE UNIQUE INDEX uq_walks_one_active_per_user
    ON walks (user_id)
    WHERE status = 'ACTIVE';

CREATE TABLE walk_points (
    id               BIGSERIAL PRIMARY KEY,
    walk_id          BIGINT       NOT NULL REFERENCES walks(id) ON DELETE CASCADE,
    latitude         NUMERIC(10,7) NOT NULL,
    longitude        NUMERIC(11,7) NOT NULL,
    timestamp        TIMESTAMPTZ  NOT NULL,
    sequence_number  INTEGER      NOT NULL,
    geom             GEOMETRY(POINT, 4326) NOT NULL,
    CONSTRAINT uq_walk_points_walk_seq UNIQUE (walk_id, sequence_number),
    CONSTRAINT chk_geom_matches_coords CHECK (
        ST_X(geom) = longitude::float8 AND ST_Y(geom) = latitude::float8
    )
);

CREATE INDEX idx_walk_points_walk_id ON walk_points (walk_id, sequence_number);
CREATE INDEX idx_walk_points_geom_gist ON walk_points USING GIST (geom);
