package com.finguard.api.service;

import com.finguard.api.dto.DashboardSummary;
import com.finguard.api.dto.StabilityResponse;
import com.finguard.api.entity.User;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class AdvisorAlgorithmicService {

    private static final Set<String> savingsTerms = Set.of("save", "savings", "goal", "buffer", "cushion");
    private static final Set<String> investTerms = Set.of("invest", "investment", "sip", "fd", "gold", "mutual", "wealth");
    private static final Set<String> budgetTerms = Set.of("budget", "plan", "spend", "tracking", "cashflow", "split");
    private static final Set<String> stabilityTerms = Set.of("stability", "volatile", "risk", "fsi", "score", "runway");
    private static final Set<String> anomalyTerms = Set.of("anomaly", "fraud", "alert", "outlier", "suspicious", "transaction");

    public String buildAlgorithmicReply(User user, String message, DashboardSummary dashboard, StabilityResponse stability) {
        double income = safe(dashboard.totalIncome());
        double expense = safe(dashboard.totalExpense());
        double balance = safe(dashboard.balance());
        double fsi = safe(dashboard.stabilityScore());
        double savingsPotential = safe(dashboard.savingsPotential());
        double volatility = safe(stability.volatilityIndex());
        long activeAlerts = countActiveAlerts(dashboard);
        double runway = expense > 0 ? balance / expense : 99.0;

        Category category = chooseCategory(message, income, expense, fsi, savingsPotential, volatility, activeAlerts, runway);
        return generateReply(category, user, income, expense, balance, fsi, savingsPotential, volatility, activeAlerts, runway);
    }

    private double safe(Double value) {
        return value == null ? 0.0 : value;
    }

    private long countActiveAlerts(DashboardSummary dashboard) {
        if (dashboard.fraudAlerts() == null) {
            return 0;
        }
        return dashboard.fraudAlerts().stream().filter(a -> "ACTIVE".equalsIgnoreCase(a.status())).count();
    }

    private Category chooseCategory(String message, double income, double expense, double fsi,
                                    double savingsPotential, double volatility, long activeAlerts, double runway) {
        double msgSavings = messageScore(message, savingsTerms);
        double msgInvest = messageScore(message, investTerms);
        double msgBudget = messageScore(message, budgetTerms);
        double msgStability = messageScore(message, stabilityTerms);
        double msgAnomaly = messageScore(message, anomalyTerms);

        double normalizedIncome = normalize(income, 1000, 200000);
        double normalizedExpense = normalize(expense, 1000, 150000);
        double normalizedSavingsPotential = normalize(savingsPotential, 0, 100000);

        double savingsWeight = msgSavings * 2.0 + normalizedSavingsPotential * 1.5 + (1 - fsi / 100) * 0.8;
        double investWeight = msgInvest * 2.0 + (fsi / 100) * 1.2 + normalizedSavingsPotential * 0.8;
        double budgetWeight = msgBudget * 2.0 + normalize(expense / Math.max(income, 1.0), 0, 2) * 1.5 + (runway < 3 ? 0.8 : 0.0);
        double stabilityWeight = msgStability * 2.0 + (1 - fsi / 100) * 1.2 + normalize(volatility, 0, 100) * 0.8;
        double anomalyWeight = msgAnomaly * 2.0 + (activeAlerts > 0 ? 1.5 : 0.0);
        double summaryWeight = 0.5 + msgSavings * 0.4 + msgInvest * 0.4 + msgBudget * 0.4 + msgStability * 0.4 + msgAnomaly * 0.4;

        return Category.fromScores(savingsWeight, investWeight, budgetWeight, stabilityWeight, anomalyWeight, summaryWeight);
    }

    private double messageScore(String message, Set<String> terms) {
        if (message == null || message.isBlank()) {
            return 0;
        }
        String lower = message.toLowerCase(Locale.ROOT);
        double score = 0.0;
        for (String term : terms) {
            if (lower.contains(term)) {
                score += 1.0;
            }
        }
        return Math.min(score, 3.0);
    }

    private double normalize(double value, double min, double max) {
        if (value <= min) {
            return 0;
        }
        if (value >= max) {
            return 1;
        }
        return (value - min) / (max - min);
    }

    private String generateReply(Category category, User user, double income, double expense, double balance,
                                 double fsi, double savingsPotential, double volatility, long activeAlerts, double runway) {
        String name = user.getFullName() == null ? "Customer" : user.getFullName();
        switch (category) {
            case SAVINGS -> {
                double recommendedSweep = Math.max(500, Math.min(income * 0.15, income * 0.30));
                double runwayTarget = Math.max(3.0, Math.min(runway + 1.5, 6.0));
                return String.format("### 💡 Algorithmic Savings Plan for %s\n" +
                                "* Current balance: %s | Income: %s | Savings potential: %s/mo\n" +
                                "* FSI: %.1f/100 | Runway: %.1f months\n\n" +
                                "Recommendations:\n" +
                                "1. Reserve %s of every payout into a savings vault.\n" +
                                "2. Target a %s-month cushion from current cashflow.\n" +
                                "3. If volatility is high, keep at least 1.5x your monthly expense in liquid savings.\n",
                        name,
                        formatCurrency(balance),
                        formatCurrency(income),
                        formatCurrency(savingsPotential),
                        fsi,
                        runway,
                        formatCurrency(recommendedSweep),
                        formatDecimal(runwayTarget));
            }
            case INVESTMENT -> {
                double recommendedSip = Math.max(500, Math.min(savingsPotential * 0.6, income * 0.20));
                return String.format("### 📈 Algorithmic Investment Guidance for %s\n" +
                                "* FSI: %.1f/100 | Volatility: %.1f | Savings potential: %s/mo\n\n" +
                                "Guidance:\n" +
                                "1. Start a disciplined SIP of %s/month when your emergency buffer is adequate.\n" +
                                "2. Prefer low-cost mutual funds or recurring deposits for predictable returns.\n" +
                                "3. Delay high-risk trading if your runway is below 4 months.\n",
                        name,
                        fsi,
                        volatility,
                        formatCurrency(savingsPotential),
                        formatCurrency(recommendedSip));
            }
            case BUDGET -> {
                double needs = income * 0.50;
                double cushion = income * 0.20;
                double goals = income * 0.30;
                return String.format("### 🧾 Algorithmic Budget Framework\n" +
                                "* Total income: %s | Total expense: %s | Runway: %.1f months\n\n" +
                                "Suggested split:\n" +
                                "- Needs: %s\n" +
                                "- Cushion: %s\n" +
                                "- Goals/investment: %s\n" +
                                "Use the goal bucket to capture savings, SIPs, or prepayments based on your target.\n",
                        formatCurrency(income),
                        formatCurrency(expense),
                        runway,
                        formatCurrency(needs),
                        formatCurrency(cushion),
                        formatCurrency(goals));
            }
            case STABILITY -> {
                return String.format("### 🛡️ Algorithmic Stability Assessment\n" +
                                "* FSI: %.1f/100 | Risk: %s | Volatility: %.1f\n" +
                                "* Balance: %s | Expenses: %s | Runway: %.1f months\n\n" +
                                "Focus areas:\n" +
                                "1. Build a runway of at least 3 months.\n" +
                                "2. Keep volatility under 25 by smoothing income and smoothing expenses.\n" +
                                "3. Use savings potential of %s/mo to improve resilience gradually.\n",
                        fsi,
                        dashboardRiskLabel(fsi),
                        volatility,
                        formatCurrency(balance),
                        formatCurrency(expense),
                        runway,
                        formatCurrency(savingsPotential));
            }
            case ANOMALY -> {
                return String.format("### 🛡️ Algorithmic Anomaly Review\n" +
                                "* Active alerts: %d | Balance: %s | Expense run-rate: %s\n\n" +
                                "Recommendations:\n" +
                                "1. Investigate each active alert and approve or resolve it quickly.\n" +
                                "2. Mark recurring validated transactions clearly to reduce noise.\n" +
                                "3. Keep an eye on large one-off debits and suspicious income spikes.\n",
                        activeAlerts,
                        formatCurrency(balance),
                        formatCurrency(expense));
            }
            default -> {
                return String.format("### 🔎 Algorithmic Financial Snapshot for %s\n" +
                                "* FSI: %.1f/100 | Risk: %s | Runway: %.1f months\n" +
                                "* Income: %s | Expense: %s | Savings potential: %s/mo\n\n" +
                                "Suggested next step: ask about savings, investing, budgeting, or stability for tailored advice.\n",
                        name,
                        fsi,
                        dashboardRiskLabel(fsi),
                        runway,
                        formatCurrency(income),
                        formatCurrency(expense),
                        formatCurrency(savingsPotential));
            }
        }
    }

    private String dashboardRiskLabel(double fsi) {
        if (fsi >= 80) {
            return "LOW";
        }
        if (fsi >= 60) {
            return "MODERATE";
        }
        if (fsi >= 40) {
            return "HIGH";
        }
        return "CRITICAL";
    }

    private String formatCurrency(double amount) {
        try {
            NumberFormat nf = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
            nf.setMaximumFractionDigits(0);
            return nf.format(amount);
        } catch (Exception ex) {
            return "₹" + Math.round(amount);
        }
    }

    private String formatDecimal(double value) {
        return String.format(Locale.ENGLISH, "%.1f", value);
    }

    private enum Category {
        SAVINGS,
        INVESTMENT,
        BUDGET,
        STABILITY,
        ANOMALY,
        SUMMARY;

        static Category fromScores(double savings, double invest, double budget, double stability,
                                   double anomaly, double summary) {
            double max = savings;
            Category result = SAVINGS;
            if (invest > max) {
                max = invest;
                result = INVESTMENT;
            }
            if (budget > max) {
                max = budget;
                result = BUDGET;
            }
            if (stability > max) {
                max = stability;
                result = STABILITY;
            }
            if (anomaly > max) {
                max = anomaly;
                result = ANOMALY;
            }
            if (summary > max) {
                result = SUMMARY;
            }
            return result;
        }
    }
}
