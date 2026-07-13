package com.finguard.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AdvisorChatRequest(
        @NotBlank @Size(max = 4000) String message,
        List<AdvisorChatMessageDto> history
) {
}
