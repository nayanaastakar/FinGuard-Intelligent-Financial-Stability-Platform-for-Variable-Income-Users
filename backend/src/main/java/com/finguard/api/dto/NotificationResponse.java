package com.finguard.api.dto;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        String title,
        String message,
        String type,
        Boolean isRead,
        LocalDateTime createdAt
) {}
