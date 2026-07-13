package com.finguard.api.service;

import com.finguard.api.dto.ExpenseRequest;
import com.finguard.api.entity.Expense;
import com.finguard.api.entity.Transaction;
import com.finguard.api.entity.User;
import com.finguard.api.exception.ResourceNotFoundException;
import com.finguard.api.repository.ExpenseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    private static final double ROUND_UP_UNIT = 10.0;
    private static final double DEFAULT_AUTO_ROUND_UP_BUCKET_THRESHOLD = 50.0;
    private static final String AUTO_ROUND_UP_GOAL_NAME = "Auto Round-Up Savings";

    private final ExpenseRepository expenseRepository;
    private final TransactionService transactionService;
    private final FraudDetectionService fraudDetectionService;
    private final StabilityService stabilityService;
    private final com.finguard.api.repository.SavingsGoalRepository savingsGoalRepository;
    private final NotificationService notificationService;

    public ExpenseService(ExpenseRepository expenseRepository,
                          TransactionService transactionService,
                          FraudDetectionService fraudDetectionService,
                          StabilityService stabilityService,
                          com.finguard.api.repository.SavingsGoalRepository savingsGoalRepository,
                          NotificationService notificationService) {
        this.expenseRepository = expenseRepository;
        this.transactionService = transactionService;
        this.fraudDetectionService = fraudDetectionService;
        this.stabilityService = stabilityService;
        this.savingsGoalRepository = savingsGoalRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public Expense addExpense(ExpenseRequest request, User user) {
        Expense expense = new Expense();
        expense.setUser(user);
        expense.setAmount(request.amount());
        expense.setCategory(request.category());
        expense.setDate(request.date());
        expense.setDescription(request.description());
        expense.setAccountName(request.accountName());
        expense.setAccountType(request.accountType());
        expense.setUpiId(request.upiId());

        Expense savedExpense = expenseRepository.save(expense);

        // Sync to unified Transaction ledger
        Transaction transaction = transactionService.logTransaction(
                user,
                "EXPENSE",
                savedExpense.getAmount(),
                savedExpense.getCategory(),
                savedExpense.getDate(),
                savedExpense.getDescription(),
                savedExpense.getAccountName(),
                savedExpense.getAccountType(),
                savedExpense.getUpiId(),
                savedExpense.getId()
        );

        // Trigger real-time AI Fraud & Anomaly Analysis
        fraudDetectionService.analyzeTransaction(transaction);

        // Recalculate stability index
        stabilityService.calculateStability(user);

        // Auto Round-Up logic
        if (Boolean.TRUE.equals(user.getAutoRoundUpEnabled())) {
            double rounded = Math.ceil(savedExpense.getAmount() / ROUND_UP_UNIT) * ROUND_UP_UNIT;
            if (rounded == savedExpense.getAmount()) {
                rounded += ROUND_UP_UNIT; // always round up by one unit if already at a multiple
            }
            double spareChange = Math.round((rounded - savedExpense.getAmount()) * 100.0) / 100.0;
            if (spareChange > 0.0) {
                Optional<com.finguard.api.entity.SavingsGoal> existingFallback = savingsGoalRepository.findByUserAndName(user, AUTO_ROUND_UP_GOAL_NAME);
                com.finguard.api.entity.SavingsGoal fallbackGoal = existingFallback.orElseGet(() -> {
                    com.finguard.api.entity.SavingsGoal goal = new com.finguard.api.entity.SavingsGoal(
                            user,
                            AUTO_ROUND_UP_GOAL_NAME,
                            100.0,
                            0.0,
                            null
                    );
                    return savingsGoalRepository.save(goal);
                });

                fallbackGoal.setCurrentAmount(Math.round((fallbackGoal.getCurrentAmount() + spareChange) * 100.0) / 100.0);
                savingsGoalRepository.save(fallbackGoal);

                double bucketThreshold = user.getRoundUpBucketThreshold() != null ? user.getRoundUpBucketThreshold() : DEFAULT_AUTO_ROUND_UP_BUCKET_THRESHOLD;
                if (fallbackGoal.getCurrentAmount() >= bucketThreshold) {
                    // Release the bucket to active goals proportionally, excluding the bucket itself
                    double bucketAmount = Math.round(fallbackGoal.getCurrentAmount() * 100.0) / 100.0;
                    List<com.finguard.api.entity.SavingsGoal> goals = savingsGoalRepository.findByUserAndStatus(user, "ACTIVE").stream()
                            .filter(g -> !AUTO_ROUND_UP_GOAL_NAME.equals(g.getName()))
                            .collect(Collectors.toList());
                    List<String> allocationNotes = new ArrayList<>();
                    double distributed = 0.0;

                    if (!goals.isEmpty()) {
                        List<Double> remaining = goals.stream()
                                .map(g -> Math.max(0.0, g.getTargetAmount() - g.getCurrentAmount()))
                                .collect(Collectors.toList());
                        double totalRemaining = remaining.stream().mapToDouble(Double::doubleValue).sum();

                        if (totalRemaining > 0.0) {
                            for (int i = 0; i < goals.size(); i++) {
                                com.finguard.api.entity.SavingsGoal g = goals.get(i);
                                double gap = remaining.get(i);
                                double alloc = Math.round((bucketAmount * (gap / totalRemaining)) * 100.0) / 100.0;
                                double add = Math.min(alloc, gap);
                                if (add > 0) {
                                    g.setCurrentAmount(Math.round((g.getCurrentAmount() + add) * 100.0) / 100.0);
                                    if (g.getCurrentAmount() >= g.getTargetAmount()) {
                                        g.setStatus("COMPLETED");
                                    }
                                    savingsGoalRepository.save(g);
                                    distributed += add;
                                    allocationNotes.add(String.format("₹%.2f → %s", add, g.getName()));
                                }
                            }
                        }

                        double leftover = Math.round((bucketAmount - distributed) * 100.0) / 100.0;
                        if (leftover > 0.0) {
                            for (com.finguard.api.entity.SavingsGoal g : goals) {
                                double gap = Math.max(0.0, g.getTargetAmount() - g.getCurrentAmount());
                                if (gap <= 0) continue;
                                double add = Math.min(gap, leftover);
                                add = Math.round(add * 100.0) / 100.0;
                                if (add > 0) {
                                    g.setCurrentAmount(Math.round((g.getCurrentAmount() + add) * 100.0) / 100.0);
                                    if (g.getCurrentAmount() >= g.getTargetAmount()) {
                                        g.setStatus("COMPLETED");
                                    }
                                    savingsGoalRepository.save(g);
                                    distributed += add;
                                    allocationNotes.add(String.format("₹%.2f → %s", add, g.getName()));
                                    leftover = Math.round((leftover - add) * 100.0) / 100.0;
                                    if (leftover <= 0.0) break;
                                }
                            }
                        }

                        if (distributed > 0.0) {
                            fallbackGoal.setCurrentAmount(Math.round((fallbackGoal.getCurrentAmount() - distributed) * 100.0) / 100.0);
                            savingsGoalRepository.save(fallbackGoal);
                        }
                    }

                    if (!allocationNotes.isEmpty()) {
                        String msg = String.format("Auto round-up bucket released: ₹%.2f allocated to %s", 
                                distributed,
                                String.join(", ", allocationNotes));
                        notificationService.createNotification(user, "Round-up bucket released", msg, "ROUND_UP");
                    } else {
                        String msg = String.format("Your round-up bucket has reached ₹%.2f but no active goals need funds yet. It will stay in the bucket until you create or reactivate a goal.", bucketAmount);
                        notificationService.createNotification(user, "Round-up bucket ready", msg, "ROUND_UP");
                    }
                } else {
                    String msg = String.format("₹%.2f added to your round-up bucket. ₹%.2f needed to allocate to savings goals.", 
                            spareChange, 
                            Math.max(0.0, bucketThreshold - fallbackGoal.getCurrentAmount()));
                    notificationService.createNotification(user, "Round-up bucket saved", msg, "ROUND_UP");
                }
            }
        }

        return savedExpense;
    }

    @Transactional
    public Expense updateExpense(Long id, ExpenseRequest request, User user) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense record not found"));

        if (!expense.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Expense record not found");
        }

        expense.setAmount(request.amount());
        expense.setCategory(request.category());
        expense.setDate(request.date());
        expense.setDescription(request.description());
        expense.setAccountName(request.accountName());
        expense.setAccountType(request.accountType());
        expense.setUpiId(request.upiId());

        Expense updatedExpense = expenseRepository.save(expense);

        // Sync to Transaction ledger
        transactionService.updateTransaction(
                updatedExpense.getId(),
                "EXPENSE",
                updatedExpense.getAmount(),
                updatedExpense.getCategory(),
                updatedExpense.getDate(),
                updatedExpense.getDescription(),
                updatedExpense.getAccountName(),
                updatedExpense.getAccountType(),
                updatedExpense.getUpiId()
        );

        // Recalculate stability
        stabilityService.calculateStability(user);

        return updatedExpense;
    }

    @Transactional
    public void deleteExpense(Long id, User user) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense record not found"));

        if (!expense.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Expense record not found");
        }

        expenseRepository.delete(expense);

        // Remove from ledger
        transactionService.deleteTransaction(id, "EXPENSE");

        // Recalculate stability
        stabilityService.calculateStability(user);
    }

    public List<Expense> getUserExpenses(User user) {
        return expenseRepository.findByUserOrderByDateDesc(user);
    }
}
