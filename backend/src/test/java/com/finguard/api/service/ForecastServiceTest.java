package com.finguard.api.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ForecastServiceTest {

    private final ForecastService forecastService = new ForecastService();

    @Test
    void forecastNextMonth_withEmptySeries_returnsZero() {
        double next = forecastService.forecastNextMonth(List.of());

        assertEquals(0.0, next, 0.001);
    }

    @Test
    void forecastNextMonth_withRisingSeries_returnsValueAtOrAboveLastPoint() {
        double next = forecastService.forecastNextMonth(List.of(100.0, 200.0, 300.0));

        assertTrue(next >= 300.0, "Prediction should be at or above the last observed point");
    }

    @Test
    void forecastNextNMonths_withFewNonZeroPoints_returnsNonNegativeProjection() {
        var projection = forecastService.forecastNextNMonths(List.of(0.0, 0.0, 1000.0), 3);

        assertEquals(3, projection.size());
        assertTrue(projection.get(0) >= 0.0);
        assertTrue(projection.get(1) >= 0.0);
        assertTrue(projection.get(2) >= 0.0);
    }
}
