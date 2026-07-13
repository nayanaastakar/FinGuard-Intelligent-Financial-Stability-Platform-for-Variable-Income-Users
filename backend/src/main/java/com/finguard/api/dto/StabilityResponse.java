package com.finguard.api.dto;

import java.time.LocalDateTime;
import java.util.List;

public record StabilityResponse(
        Double score,
        Double savingsPotential,
        String riskLevel,
        String aiSuggestions,
        LocalDateTime calculatedAt,
        Double totalIncome,
        Double totalExpense,
        Double volatilityIndex,
        Double predictedIncome,
        Double predictedExpense,
        Double totalAssets,
        Double totalLiabilities,
        Double netWorth,
        Double recommendedSavings,
        List<Double> historicalIncome,
        List<Double> historicalExpense,
        List<Double> projectedIncome,
        List<Double> projectedExpense,
        List<String> projectionMonthLabels
) {}
