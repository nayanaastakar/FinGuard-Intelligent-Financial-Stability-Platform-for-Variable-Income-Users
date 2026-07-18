package com.finguard.api.controller;

import com.finguard.api.dto.SavingsGoalRequest;
import com.finguard.api.dto.SavingsGoalResponse;
import com.finguard.api.entity.User;
import com.finguard.api.service.AuthService;
import com.finguard.api.service.SavingsGoalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/savings")
@Tag(name = "Savings Goal Module", description = "Endpoints for managing user savings goals, targets, and automatic contributions.")
public class SavingsGoalController {

    private final SavingsGoalService savingsGoalService;
    private final AuthService authService;

    public SavingsGoalController(SavingsGoalService savingsGoalService, AuthService authService) {
        this.savingsGoalService = savingsGoalService;
        this.authService = authService;
    }

    @GetMapping
    @Operation(summary = "Get user savings goals")
    public ResponseEntity<List<SavingsGoalResponse>> getGoals(Principal principal) {
        User user = authService.getAuthenticatedUser(principal.getName());
        return ResponseEntity.ok(savingsGoalService.getGoalsForUser(user));
    }

    @PostMapping
    @Operation(summary = "Create a new savings goal")
    public ResponseEntity<SavingsGoalResponse> createGoal(Principal principal, @Valid @RequestBody SavingsGoalRequest request) {
        User user = authService.getAuthenticatedUser(principal.getName());
        return ResponseEntity.ok(savingsGoalService.createGoal(user, request));
    }

    @PostMapping("/{id}/contribute")
    @Operation(summary = "Contribute or withdraw from a savings goal")
    public ResponseEntity<SavingsGoalResponse> contribute(Principal principal, @PathVariable Long id, @RequestParam Double amount) {
        User user = authService.getAuthenticatedUser(principal.getName());
        return ResponseEntity.ok(savingsGoalService.contribute(user, id, amount));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a savings goal")
    public ResponseEntity<Void> deleteGoal(Principal principal, @PathVariable Long id) {
        User user = authService.getAuthenticatedUser(principal.getName());
        savingsGoalService.deleteGoal(user, id);
        return ResponseEntity.noContent().build();
    }
}
