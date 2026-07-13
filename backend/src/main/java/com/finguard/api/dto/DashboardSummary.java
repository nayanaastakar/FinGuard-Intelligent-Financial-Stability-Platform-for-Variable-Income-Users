package com.finguard.api.dto;

import java.util.List;
import java.util.Map;

public record DashboardSummary(
        Double totalIncome,
        Double totalExpense,
        Double balance,
        Double stabilityScore,
        String riskLevel,
        Double savingsPotential,
        List<TransactionDto> recentTransactions,
        Map<String, Double> monthlyExpensesByCategory,
        Map<String, Double> monthlyIncomesByCategory,
        List<NotificationResponse> notifications,
        List<FraudAlertResponse> fraudAlerts,
        ForecastResult incomeForecast,
        ForecastResult expenseForecast
) {}
