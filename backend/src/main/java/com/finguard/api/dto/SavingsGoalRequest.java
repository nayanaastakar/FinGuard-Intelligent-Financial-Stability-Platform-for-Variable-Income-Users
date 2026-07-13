package com.finguard.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record SavingsGoalRequest(
        @NotBlank(message = "Goal name is required")
        String name,

        @NotNull(message = "Target amount is required")
        @Positive(message = "Target amount must be positive")
        Double targetAmount,

        Double currentAmount,

        String targetDate // YYYY-MM-DD
) {}
