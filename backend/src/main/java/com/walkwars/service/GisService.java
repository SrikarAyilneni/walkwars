package com.walkwars.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.walkwars.dto.response.BoundsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GisService {

    private final ObjectMapper objectMapper;

    public Map<String, Object> parseGeoJson(String geoJson) {
        try {
            return objectMapper.readValue(geoJson, new TypeReference<>() {});
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid GeoJSON", e);
        }
    }

    public BoundsResponse calculateBounds(Map<String, Object> geoJson) {
        @SuppressWarnings("unchecked")
        List<List<Double>> coords = (List<List<Double>>) geoJson.get("coordinates");
        if (coords == null || coords.isEmpty()) {
            return null;
        }

        double minLat = Double.MAX_VALUE;
        double minLng = Double.MAX_VALUE;
        double maxLat = -Double.MAX_VALUE;
        double maxLng = -Double.MAX_VALUE;

        for (List<Double> point : coords) {
            double lng = point.get(0);
            double lat = point.get(1);
            minLat = Math.min(minLat, lat);
            minLng = Math.min(minLng, lng);
            maxLat = Math.max(maxLat, lat);
            maxLng = Math.max(maxLng, lng);
        }

        return BoundsResponse.builder()
                .southWest(List.of(minLat, minLng))
                .northEast(List.of(maxLat, maxLng))
                .build();
    }

    public BoundsResponse calculateBoundsFromDb(double ymin, double xmin, double ymax, double xmax) {
        return BoundsResponse.builder()
                .southWest(List.of(ymin, xmin))
                .northEast(List.of(ymax, xmax))
                .build();
    }
}
