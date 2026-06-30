CREATE OR REPLACE FUNCTION fn_build_walk_path(p_walk_id BIGINT)
RETURNS TABLE (
    path_geom GEOMETRY(LINESTRING, 4326),
    distance_m NUMERIC
) AS $$
DECLARE
    v_line GEOMETRY(LINESTRING, 4326);
    v_dist NUMERIC;
BEGIN
    SELECT ST_MakeLine(geom ORDER BY sequence_number)
    INTO v_line
    FROM walk_points
    WHERE walk_id = p_walk_id;

    IF v_line IS NULL THEN
        RAISE EXCEPTION 'No points for walk %', p_walk_id;
    END IF;

    v_dist := ST_Length(v_line::geography);

    RETURN QUERY SELECT v_line, round(v_dist::numeric, 2);
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION fn_detect_closed_loop(
    p_walk_id BIGINT,
    p_closure_radius_m DOUBLE PRECISION DEFAULT 25.0,
    p_min_perimeter_m DOUBLE PRECISION DEFAULT 100.0
) RETURNS BOOLEAN AS $$
DECLARE
    v_start GEOMETRY;
    v_end GEOMETRY;
    v_line GEOMETRY;
    v_perimeter DOUBLE PRECISION;
BEGIN
    SELECT geom INTO v_start FROM walk_points
    WHERE walk_id = p_walk_id ORDER BY sequence_number ASC LIMIT 1;

    SELECT geom INTO v_end FROM walk_points
    WHERE walk_id = p_walk_id ORDER BY sequence_number DESC LIMIT 1;

    IF v_start IS NULL OR v_end IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT ST_MakeLine(geom ORDER BY sequence_number) INTO v_line
    FROM walk_points WHERE walk_id = p_walk_id;

    v_perimeter := ST_Length(v_line::geography);

    RETURN v_perimeter >= p_min_perimeter_m
       AND ST_DWithin(v_start::geography, v_end::geography, p_closure_radius_m);
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION fn_create_territory_polygon(p_walk_id BIGINT)
RETURNS TABLE (
    polygon_geom GEOMETRY(POLYGON, 4326),
    area_sq_m NUMERIC
) AS $$
DECLARE
    v_line GEOMETRY(LINESTRING, 4326);
    v_poly GEOMETRY(POLYGON, 4326);
    v_area NUMERIC;
    v_n INT;
BEGIN
    IF NOT fn_detect_closed_loop(p_walk_id) THEN
        RAISE EXCEPTION 'Walk % is not a valid closed loop', p_walk_id;
    END IF;

    SELECT COUNT(*) INTO v_n FROM walk_points WHERE walk_id = p_walk_id;
    IF v_n < 3 THEN
        RAISE EXCEPTION 'Minimum 3 points required for polygon';
    END IF;

    SELECT ST_MakeLine(geom ORDER BY sequence_number) INTO v_line
    FROM walk_points WHERE walk_id = p_walk_id;

    IF NOT ST_Equals(ST_StartPoint(v_line), ST_EndPoint(v_line)) THEN
        v_line := ST_AddPoint(v_line, ST_StartPoint(v_line));
    END IF;

    v_poly := ST_MakePolygon(v_line);
    v_area := ST_Area(v_poly::geography);

    RETURN QUERY SELECT v_poly, round(v_area::numeric, 2);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_user_total_distance(p_user_id BIGINT)
RETURNS NUMERIC AS $$
    SELECT COALESCE(SUM(distance_meters), 0)
    FROM walks
    WHERE user_id = p_user_id AND status = 'COMPLETED';
$$ LANGUAGE sql STABLE;
