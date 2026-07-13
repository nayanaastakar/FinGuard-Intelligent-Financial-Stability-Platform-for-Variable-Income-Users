package com.finguard.api.dto;

import java.util.List;

public record ForecastResult(
        List<Double> linear,
        List<Double> holt,
        List<Double> arima,
        List<Double> lstm,
        List<Double> hw,
        List<Double> croston,
        List<Double> ensemble
) {}
