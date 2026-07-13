package com.finguard.api.dto;

import java.time.LocalDate;

public record AssetRequest(String name, String type, Double value, LocalDate date) {}
