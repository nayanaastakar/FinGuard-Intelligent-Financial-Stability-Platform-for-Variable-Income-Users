package com.finguard.api.dto;

public record AuthResponse(
        String token,
        Long userId,
        String username,
        String email,
        String fullName,
        String role,
        String profession,
        Double targetSavings,
        Boolean autoRoundUpEnabled,
        Double roundUpBucketThreshold
) {}
