package com.finguard.api.dto;

public record AdvisorChatResponse(
        String reply,
        String provider,
        boolean realAiUsed
) {
}
