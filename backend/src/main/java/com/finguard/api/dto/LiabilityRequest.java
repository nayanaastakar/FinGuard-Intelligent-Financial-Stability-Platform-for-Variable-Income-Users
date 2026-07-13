package com.finguard.api.dto;

import java.time.LocalDate;

public record LiabilityRequest(String name, String type, Double value, Double interestRate, LocalDate date) {}
