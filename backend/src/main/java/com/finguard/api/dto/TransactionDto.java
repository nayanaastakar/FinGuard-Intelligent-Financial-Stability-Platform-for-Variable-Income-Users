package com.finguard.api.dto;

import java.time.LocalDate;

public record TransactionDto(
        Long id,
        String type,
        Double amount,
        String category,
        LocalDate date,
        String description,
        String accountName,
        String accountType,
        String upiId
) {}
