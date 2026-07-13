package com.finguard.api.service;

import com.finguard.api.dto.*;
import com.finguard.api.entity.Expense;
import com.finguard.api.entity.Income;
import com.finguard.api.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final IncomeService incomeService;
    private final ExpenseService expenseService;
    private final TransactionService transactionService;
    private final StabilityService stabilityService;
    private final ForecastService forecastService;
    private final NotificationService notificationService;
    private final FraudDetectionService fraudDetectionService;

    public DashboardService(IncomeService incomeService,
                            ExpenseService expenseService,
                            TransactionService transactionService,
                            StabilityService stabilityService,
                            ForecastService forecastService,
                            NotificationService notificationService,
                            FraudDetectionService fraudDetectionService) {
        this.incomeService = incomeService;
        this.expenseService = expenseService;
        this.transactionService = transactionService;
        this.stabilityService = stabilityService;
        this.forecastService = forecastService;
        this.notificationService = notificationService;
        this.fraudDetectionService = fraudDetectionService;
    }

    @Transactional
    public DashboardSummary getDashboardSummary(User user) {
        List<Income> incomes = incomeService.getUserIncomes(user);
        List<Expense> expenses = expenseService.getUserExpenses(user);
        List<TransactionDto> transactions = transactionService.getUserTransactions(user);

        double totalIncome = incomes.stream().mapToDouble(Income::getAmount).sum();
        double totalExpense = expenses.stream().mapToDouble(Expense::getAmount).sum();
        double balance = totalIncome - totalExpense;

        // Calculate stability parameters
        StabilityResponse stability = stabilityService.calculateStability(user);

        // Limit transactions to latest 10
        List<TransactionDto> recentTransactions = transactions.stream()
                .limit(10)
                .collect(Collectors.toList());

        // Category distributions
        Map<String, Double> expensesByCategory = expenses.stream()
                .collect(Collectors.groupingBy(
                        Expense::getCategory,
                        Collectors.summingDouble(Expense::getAmount)
                ));

        Map<String, Double> incomesByCategory = incomes.stream()
                .collect(Collectors.groupingBy(
                        Income::getCategory,
                        Collectors.summingDouble(Income::getAmount)
                ));

        // User alert panels
        List<NotificationResponse> notifications = notificationService.getUserNotifications(user)
                .stream()
                .limit(5)
                .collect(Collectors.toList());

        List<FraudAlertResponse> fraudAlerts = fraudDetectionService.getUserFraudAlerts(user)
                .stream()
                .limit(5)
                .collect(Collectors.toList());

        return new DashboardSummary(
                totalIncome,
                totalExpense,
                balance,
                stability.score(),
                stability.riskLevel(),
                stability.savingsPotential(),
                recentTransactions,
                expensesByCategory,
                incomesByCategory,
                notifications,
                fraudAlerts,
                buildForecastResult(stability.historicalIncome()),
                buildForecastResult(stability.historicalExpense())
        );
    }

    private ForecastResult buildForecastResult(List<Double> history) {
        int projectionMonths = 6;
        return new ForecastResult(
                forecastService.forecastLinearRegression(history, projectionMonths),
                forecastService.forecastHolt(history, projectionMonths),
                forecastService.forecastMeanReversion(history, projectionMonths),
                forecastService.forecastDoubleExponential(history, projectionMonths),
                forecastService.forecastHoltWinters(history, projectionMonths),
                forecastService.forecastCroston(history, projectionMonths),
                forecastService.forecastEnsemble(history, projectionMonths)
        );
    }
}
