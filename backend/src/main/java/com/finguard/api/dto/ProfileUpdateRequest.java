package com.finguard.api.dto;

import jakarta.validation.constraints.NotBlank;

public record ProfileUpdateRequest(
        @NotBlank(message = "Full name is required")
        String fullName,
        String profession,
        Double targetSavings,
        Boolean autoRoundUpEnabled,
        Double roundUpBucketThreshold
) {}
