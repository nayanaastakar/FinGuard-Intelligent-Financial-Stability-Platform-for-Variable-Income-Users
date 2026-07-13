package com.finguard.api.dto;

import java.time.LocalDateTime;

public record FraudAlertResponse(
        Long id,
        String alertType,
        String description,
        String status,
        LocalDateTime createdAt,
        Long transactionId,
        Double amount,
        String category
) {}
