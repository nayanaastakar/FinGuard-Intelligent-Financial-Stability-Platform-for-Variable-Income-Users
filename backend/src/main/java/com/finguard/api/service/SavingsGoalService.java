package com.finguard.api.service;

import com.finguard.api.dto.SavingsGoalRequest;
import com.finguard.api.dto.SavingsGoalResponse;
import com.finguard.api.entity.SavingsGoal;
import com.finguard.api.entity.User;
import com.finguard.api.repository.SavingsGoalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SavingsGoalService {

    private final SavingsGoalRepository savingsGoalRepository;

    public SavingsGoalService(SavingsGoalRepository savingsGoalRepository) {
        this.savingsGoalRepository = savingsGoalRepository;
    }

    public List<SavingsGoalResponse> getGoalsForUser(User user) {
        return savingsGoalRepository.findByUser(user).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SavingsGoalResponse createGoal(User user, SavingsGoalRequest request) {
        LocalDate date = request.targetDate() != null ? LocalDate.parse(request.targetDate()) : null;
        SavingsGoal goal = new SavingsGoal(
                user,
                request.name(),
                request.targetAmount(),
                request.currentAmount() != null ? request.currentAmount() : 0.0,
                date
        );
        if (goal.getCurrentAmount() >= goal.getTargetAmount()) {
            goal.setStatus("COMPLETED");
        }
        SavingsGoal saved = savingsGoalRepository.save(goal);
        return mapToResponse(saved);
    }

    @Transactional
    public SavingsGoalResponse contribute(User user, Long goalId, Double amount) {
        SavingsGoal goal = savingsGoalRepository.findById(goalId)
                .orElseThrow(() -> new IllegalArgumentException("Savings goal not found"));

        if (!goal.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Not authorized to update this savings goal");
        }

        double newAmount = goal.getCurrentAmount() + amount;
        goal.setCurrentAmount(Math.max(0.0, newAmount));

        if (goal.getCurrentAmount() >= goal.getTargetAmount()) {
            goal.setStatus("COMPLETED");
        } else {
            goal.setStatus("ACTIVE");
        }

        SavingsGoal saved = savingsGoalRepository.save(goal);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteGoal(User user, Long goalId) {
        SavingsGoal goal = savingsGoalRepository.findById(goalId)
                .orElseThrow(() -> new IllegalArgumentException("Savings goal not found"));

        if (!goal.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Not authorized to delete this savings goal");
        }

        savingsGoalRepository.delete(goal);
    }

    public SavingsGoalResponse mapToResponse(SavingsGoal goal) {
        return new SavingsGoalResponse(
                goal.getId(),
                goal.getName(),
                goal.getTargetAmount(),
                goal.getCurrentAmount(),
                goal.getTargetDate(),
                goal.getStatus()
        );
    }
}
