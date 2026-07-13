package com.finguard.api.service;

import com.finguard.api.dto.StabilityResponse;
import com.finguard.api.entity.Income;
import com.finguard.api.entity.Expense;
import com.finguard.api.entity.Asset;
import com.finguard.api.entity.Liability;
import com.finguard.api.entity.StabilityScore;
import com.finguard.api.entity.User;
import com.finguard.api.repository.IncomeRepository;
import com.finguard.api.repository.ExpenseRepository;
import com.finguard.api.repository.AssetRepository;
import com.finguard.api.repository.LiabilityRepository;
import com.finguard.api.repository.StabilityScoreRepository;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class StabilityService {

    private final IncomeRepository incomeRepository;
    private final ExpenseRepository expenseRepository;
    private final AssetRepository assetRepository;
    private final LiabilityRepository liabilityRepository;
    private final StabilityScoreRepository stabilityScoreRepository;
    private final NotificationService notificationService;
    private final ForecastService forecastService;

    public StabilityService(IncomeRepository incomeRepository,
                            ExpenseRepository expenseRepository,
                            AssetRepository assetRepository,
                            LiabilityRepository liabilityRepository,
                            StabilityScoreRepository stabilityScoreRepository,
                            NotificationService notificationService,
                            ForecastService forecastService) {
        this.incomeRepository = incomeRepository;
        this.expenseRepository = expenseRepository;
        this.assetRepository = assetRepository;
        this.liabilityRepository = liabilityRepository;
        this.stabilityScoreRepository = stabilityScoreRepository;
        this.notificationService = notificationService;
        this.forecastService = forecastService;
    }

    @Transactional
    public StabilityResponse calculateStability(User user) {

        // Aggregate transactions into monthly buckets and keep last N months
        List<Income> incomes = incomeRepository.findByUser(user);
        List<Expense> expenses = expenseRepository.findByUser(user);

        int monthsToKeep = 9; // keep last 6-9 months as requested; using 9 for a bit more history

        Map<YearMonth, Double> incomeByMonth = incomes.stream()
                .collect(Collectors.groupingBy(i -> YearMonth.from(i.getDate()), Collectors.summingDouble(Income::getAmount)));
        Map<YearMonth, Double> expenseByMonth = expenses.stream()
                .collect(Collectors.groupingBy(e -> YearMonth.from(e.getDate()), Collectors.summingDouble(Expense::getAmount)));

        List<Double> incomeMonthly = new ArrayList<>();
        List<Double> expenseMonthly = new ArrayList<>();
        YearMonth now = YearMonth.now();
        for (int i = monthsToKeep - 1; i >= 0; i--) {
            YearMonth ym = now.minusMonths(i);
            incomeMonthly.add(incomeByMonth.getOrDefault(ym, 0.0));
            expenseMonthly.add(expenseByMonth.getOrDefault(ym, 0.0));
        }

        double totalIncome = incomeMonthly.stream().mapToDouble(Double::doubleValue).sum();
        double totalExpense = expenseMonthly.stream().mapToDouble(Double::doubleValue).sum();

        // Standard Default state if no transactions exist yet
        boolean noData = incomeMonthly.stream().allMatch(d -> d == 0.0) && expenseMonthly.stream().allMatch(d -> d == 0.0);
        if (noData) {
            return new StabilityResponse(
                    70.0,
                    0.0,
                    "LOW",
                    "Welcome! Start adding your income and expenses. We will show you a simple money health score and easy tips for you.",
                    LocalDateTime.now(),
                    0.0,
                    0.0,
                    0.0,
                    0.0,
                    0.0,
                    0.0,
                    0.0,
                    0.0,
                    0.0,
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of()
            );
        }

        // 1. Calculate Average Monthly Income (over the retained months)
        double avgIncome = totalIncome / monthsToKeep;
        double avgExpense = totalExpense / monthsToKeep;

        // 2. Calculate Standard Deviation of Income (Volatility measure) across months
        double variance = 0.0;
        for (double amt : incomeMonthly) {
            variance += Math.pow(amt - avgIncome, 2);
        }
        double stdDevIncome = Math.sqrt(variance / Math.max(1, incomeMonthly.size()));

        // Volatility Index = Coefficient of Variation (CV)
        double volatilityIndex = avgIncome > 0 ? (stdDevIncome / avgIncome) : 0.0;

        // 3. Burn Rate (ratio of average outflows to inflows)
        double burnRate = avgIncome > 0 ? (avgExpense / avgIncome) : 1.0;

        List<Asset> assets = assetRepository.findByUser(user);
        List<Liability> liabilities = liabilityRepository.findByUser(user);
        double totalAssets = assets.stream().mapToDouble(Asset::getValue).sum();
        double totalLiabilities = liabilities.stream().mapToDouble(Liability::getValue).sum();
        double netWorth = totalAssets - totalLiabilities;

        // Use interest-rate-weighted liabilities so high-interest debt penalises more
        double weightedLiabilities = liabilities.stream()
                .mapToDouble(l -> l.getValue() * (1.0 + Math.min(l.getInterestRate(), 100.0) / 100.0))
                .sum();
        double debtToAssetRatio = 0.0;
        if (totalAssets > 0) debtToAssetRatio = weightedLiabilities / totalAssets;
        else if (weightedLiabilities > 0) debtToAssetRatio = 1.0;

        // Savings goal gap: penalises FSI if actual savings potential < user's monthly target
        double savingsGoalGap = 0.0;
        if (user.getTargetSavings() != null && user.getTargetSavings() > 0) {
            double savingsPotentialNow = Math.max(0.0, avgIncome - avgExpense);
            double ratio = savingsPotentialNow / user.getTargetSavings();
            savingsGoalGap = Math.max(0.0, Math.min(1.0, 1.0 - ratio)); // 0 = on track, 1 = severely behind
        }

        // 4. Updated FSI Formula (weights sum to 1.0)
        // BurnRate=0.38 | Volatility=0.27 | DebtRatio=0.22 | SavingsGoalGap=0.10 | Margin=0.03
        double rawScore = 100.0 * (
            1.0
            - (0.38 * burnRate)
            - (0.27 * Math.min(1.0, volatilityIndex))
            - (0.22 * Math.min(1.0, debtToAssetRatio))
            - (0.10 * savingsGoalGap)
        );

        // Adjustments based on overall standing
        double fsiScore = Math.max(5.0, Math.min(98.0, rawScore));
        double currentBalance = totalIncome - totalExpense;

        if (currentBalance < 0) {
            fsiScore = Math.min(30.0, fsiScore); // Severely capped score if account is in negative standing
        }

        // 5. savings potential & Risk Level
        double savingsPotential = Math.max(0.0, avgIncome - avgExpense);
        String riskLevel = "LOW";
        if (fsiScore < 45) {
            riskLevel = "HIGH";
        } else if (fsiScore < 75) {
            riskLevel = "MEDIUM";
        }

        // Check if risk is high and trigger notification
        if ("HIGH".equalsIgnoreCase(riskLevel)) {
            notificationService.createNotification(
                    user,
                    "Financial Stability Warning",
                    String.format("AI detected a high risk level (Stability Index: %.1f). Your burn rate is high (%.1f%%). Consider capping shopping and discretionary expenses.", fsiScore, burnRate * 100),
                    "OVERSPENDING"
            );
        }

        // 6. AI Suggestions Builder
        String aiSuggestions = buildAiSuggestions(user, fsiScore, burnRate, volatilityIndex, savingsPotential, currentBalance, netWorth, debtToAssetRatio);

        // 7. Persist Stability Record — purge previous records first to avoid infinite table growth
        stabilityScoreRepository.deleteByUser(user);
        StabilityScore scoreRecord = new StabilityScore();
        scoreRecord.setUser(user);
        scoreRecord.setScore(fsiScore);
        scoreRecord.setSavingsPotential(savingsPotential);
        scoreRecord.setRiskLevel(riskLevel);
        scoreRecord.setAiSuggestions(aiSuggestions);
        stabilityScoreRepository.save(scoreRecord);

        // 8. Forecast next month amounts (simple linear regression)
        double predictedIncome = forecastService.forecastNextMonth(incomeMonthly);
        double predictedExpense = forecastService.forecastNextMonth(expenseMonthly);
        double recommendedSavings = Math.max(0.0, predictedIncome - predictedExpense);

        // 9. Generate 6-month forward projections using recent monthly fluctuation signal
        List<Double> projectedIncome = forecastService.forecastEnsembleWithFluctuation(incomeMonthly, 6);
        List<Double> projectedExpense = forecastService.forecastEnsembleWithFluctuation(expenseMonthly, 6);

        // Build human-readable month labels for the 6 future months
        DateTimeFormatter labelFmt = DateTimeFormatter.ofPattern("MMM yyyy");
        List<String> projectionMonthLabels = new ArrayList<>();
        YearMonth nextMonth = YearMonth.now().plusMonths(1);
        for (int i = 0; i < 6; i++) {
            projectionMonthLabels.add(nextMonth.plusMonths(i).atDay(1).format(labelFmt));
        }

        return new StabilityResponse(
            fsiScore,
            savingsPotential,
            riskLevel,
            aiSuggestions,
            scoreRecord.getCalculatedAt(),
            totalIncome,
            totalExpense,
            volatilityIndex,
            predictedIncome,
            predictedExpense,
            totalAssets,
            totalLiabilities,
            netWorth,
            recommendedSavings,
            incomeMonthly,
            expenseMonthly,
            projectedIncome,
            projectedExpense,
            projectionMonthLabels
        );
    }

    private String buildAiSuggestions(User user, double fsi, double burnRate, double volatility, double savings, double balance, double netWorth, double debtRatio) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("### Money health report for %s (%s)\n", user.getFullName(), user.getProfession()));
        sb.append(String.format("* **Your score:** %.1f out of 100 (higher is better)\n", fsi));
        sb.append(String.format("* **Net Worth:** Rs %.2f (Interest-Weighted Debt Ratio: %.1f%%)\n", netWorth, debtRatio * 100));
        sb.append(String.format("* **Income ups and downs:** %.0f%% (how much your earnings change)\n", volatility * 100));
        sb.append(String.format("* **Spending vs income:** %.1f%% of income goes to expenses\n", burnRate * 100));
        if (user.getTargetSavings() != null && user.getTargetSavings() > 0) {
            sb.append(String.format("* **Savings goal progress:** Rs %.0f/month toward Rs %.0f target (%.0f%%)\n\n",
                    savings, user.getTargetSavings(), Math.min(100.0, (savings / user.getTargetSavings()) * 100)));
        } else {
            sb.append("\n");
        }

        if (fsi < 45) {
            sb.append("⚠️ **NEEDS ATTENTION:** You are spending a lot or your income changes too much. Please slow down non-essential spending.\n\n");
            sb.append("#### What to do now:\n");
            sb.append("1. **Cut extra spending** — cook at home, pause unused subscriptions, avoid big purchases this month.\n");
            sb.append("2. **Build a safety fund** — try to save at least **6 months of basic expenses** for slow work periods.\n");
            sb.append("3. **Steady income** — look for monthly retainers or repeat clients, not only one-time gigs.\n");
            if (debtRatio > 0.5) {
                sb.append("4. **High debt alert** — your interest-weighted debt ratio is critical. Prioritise clearing high-interest liabilities first.");
            }
        } else if (fsi < 75) {
            sb.append("🛡️ **OK BUT BE CAREFUL:** You are managing, but one bad month could hurt. Save a little more when income is good.\n\n");
            sb.append("#### What to do now:\n");
            sb.append("1. **Save first** — put aside **15%** of every payment before you spend.\n");
            sb.append("2. **Pay fixed bills early** — rent and utilities in the week you get paid.\n");
            sb.append(String.format("3. **Hit your goal** — try to save **Rs %.0f per month** toward your target of **Rs %.0f**.\n",
                    savings, user.getTargetSavings()));
            if (debtRatio > 0.3) {
                sb.append("4. **Reduce liabilities** — your debt carries significant interest. Paying down loans will directly improve your FSI score.");
            }
        } else {
            sb.append("💎 **GOOD NEWS:** Your money situation looks healthy. You are saving well and keeping good control.\n\n");
            sb.append("#### What to do now:\n");
            sb.append("1. **Keep saving** — move extra money to RD or safe investments.\n");
            sb.append(String.format("2. **Raise your goal** — you are close to **Rs %.0f/month** savings target; consider a higher long-term goal.\n", user.getTargetSavings()));
            if (netWorth > 0) {
                sb.append(String.format("3. **Grow net worth** — your current net worth is Rs %.0f. Consider diversifying assets across equity and fixed deposits.", netWorth));
            }
        }

        return sb.toString();
    }
}
