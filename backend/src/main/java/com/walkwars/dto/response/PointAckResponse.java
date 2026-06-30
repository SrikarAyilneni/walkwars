package com.walkwars.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PointAckResponse {

    private Long walkId;
    private Integer sequenceNumber;
    private boolean accepted;
}
