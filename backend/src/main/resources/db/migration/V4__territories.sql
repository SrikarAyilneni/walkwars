CREATE TABLE territories (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    walk_id          BIGINT       NOT NULL REFERENCES walks(id) ON DELETE CASCADE,
    polygon          GEOMETRY(POLYGON, 4326) NOT NULL,
    area_sq_meters   NUMERIC(14,2) NOT NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_territories_walk UNIQUE (walk_id)
);

CREATE INDEX idx_territories_user_id ON territories (user_id);
CREATE INDEX idx_territories_polygon_gist ON territories USING GIST (polygon);
