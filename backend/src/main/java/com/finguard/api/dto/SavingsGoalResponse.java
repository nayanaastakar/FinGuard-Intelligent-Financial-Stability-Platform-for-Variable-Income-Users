package com.finguard.api.dto;

import java.time.LocalDate;

public record SavingsGoalResponse(
        Long id,
        String name,
        Double targetAmount,
        Double currentAmount,
        LocalDate targetDate,
        String status
) {}
