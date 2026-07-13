package com.finguard.api.service;

import com.finguard.api.dto.DashboardSummary;
import com.finguard.api.dto.FraudAlertResponse;
import com.finguard.api.dto.ForecastResult;
import com.finguard.api.dto.TransactionDto;
import com.finguard.api.dto.StabilityResponse;
import com.finguard.api.entity.User;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class AdvisorAlgorithmicServiceTest {

    private final AdvisorAlgorithmicService advisorService = new AdvisorAlgorithmicService();

    private User buildUser() {
        User user = new User();
        user.setFullName("Test Student");
        return user;
    }

    private DashboardSummary buildDashboardSummary() {
        return new DashboardSummary(
                5000.0,
                2500.0,
                2500.0,
                72.0,
                "MEDIUM",
                1500.0,
                List.of(new TransactionDto(1L, "DEBIT", 500.0, "FOOD", LocalDate.now(), "Lunch", null, null, null)),
                Map.of("FOOD", 500.0),
                Map.of("SALARY", 5000.0),
                List.of(),
                List.of(new FraudAlertResponse(1L, "SUSPICIOUS", "Unusual payment", "ACTIVE", LocalDateTime.now(), 101L, 600.0, "SHOPPING")),
                new ForecastResult(List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of()),
                new ForecastResult(List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of())
        );
    }

    private StabilityResponse buildStabilityResponse() {
        return new StabilityResponse(
                72.0,
                1500.0,
                "MEDIUM",
                "Advice text",
                LocalDateTime.now(),
                5000.0,
                2500.0,
                0.12,
                5200.0,
                2400.0,
                15000.0,
                5000.0,
                10000.0,
                2000.0,
                List.of(400.0, 500.0, 450.0),
                List.of(200.0, 300.0, 250.0),
                List.of(5200.0, 5300.0),
                List.of(2400.0, 2500.0),
                List.of("May 2026", "Jun 2026")
        );
    }

    @Test
    void buildAlgorithmicReply_withSavingsMessage_returnsSavingsAdvice() {
        User user = buildUser();
        DashboardSummary dashboard = buildDashboardSummary();
        StabilityResponse stability = buildStabilityResponse();

        String reply = advisorService.buildAlgorithmicReply(user, "I want to save more money", dashboard, stability);

        assertNotNull(reply);
        assertTrue(reply.contains("Savings"));
    }

    @Test
    void buildAlgorithmicReply_withAnomalyMessage_returnsAnomalyAdvice() {
        User user = buildUser();
        DashboardSummary dashboard = buildDashboardSummary();
        StabilityResponse stability = buildStabilityResponse();

        String reply = advisorService.buildAlgorithmicReply(user, "Is this transaction suspicious?", dashboard, stability);

        assertNotNull(reply);
        assertTrue(reply.contains("Anomaly") || reply.contains("alert"), "Expected anomaly-related text");
    }

    @Test
    void buildAlgorithmicReply_withEmptyMessage_returnsAlgorithmicAnswer() {
        User user = buildUser();
        DashboardSummary dashboard = buildDashboardSummary();
        StabilityResponse stability = buildStabilityResponse();

        String reply = advisorService.buildAlgorithmicReply(user, "", dashboard, stability);

        assertNotNull(reply);
        assertTrue(reply.contains("### ") && reply.contains("Algorithmic"));
    }
}
