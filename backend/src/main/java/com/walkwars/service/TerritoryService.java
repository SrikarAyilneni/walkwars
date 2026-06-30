package com.walkwars.service;

import com.walkwars.repository.GisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TerritoryService {

    private final GisRepository gisRepository;

    @Transactional
    public boolean createFromWalk(Long userId, Long walkId) {
        try {
            GisRepository.TerritoryPolygonResult result = gisRepository.createTerritoryPolygon(walkId);
            gisRepository.insertTerritory(userId, walkId, result.polygonWkt(), result.areaSqM());
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
