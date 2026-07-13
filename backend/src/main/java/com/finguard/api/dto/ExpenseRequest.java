package com.finguard.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ExpenseRequest(
        @NotNull(message = "Amount is required")
        @Min(value = 1, message = "Amount must be greater than zero")
        Double amount,

        @NotBlank(message = "Category is required")
        String category,

        @NotNull(message = "Date is required")
        LocalDate date,

        String description,

        String accountName,

        String accountType,

        String upiId
) {
    public ExpenseRequest(Double amount, String category, LocalDate date, String description) {
        this(amount, category, date, description, null, null, null);
    }
}
