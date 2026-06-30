package com.walkwars.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class BoundsResponse {

    private List<Double> southWest;
    private List<Double> northEast;
}
