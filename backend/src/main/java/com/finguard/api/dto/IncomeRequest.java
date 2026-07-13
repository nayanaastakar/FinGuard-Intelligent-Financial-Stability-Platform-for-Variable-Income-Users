package com.finguard.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record IncomeRequest(
        @NotNull(message = "Amount is required")
        @Min(value = 1, message = "Amount must be greater than zero")
        Double amount,

        @NotBlank(message = "Category is required")
        String category,

        String source,

        @NotNull(message = "Date is required")
        LocalDate date,

        String description
) {}
