package com.finguard.api.dto;

import jakarta.validation.constraints.NotBlank;

public record AdvisorChatMessageDto(
        @NotBlank String role,
        @NotBlank String content
) {
}
