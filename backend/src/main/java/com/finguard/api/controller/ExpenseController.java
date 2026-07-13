package com.finguard.api.controller;

import com.finguard.api.dto.ExpenseRequest;
import com.finguard.api.entity.Expense;
import com.finguard.api.entity.User;
import com.finguard.api.service.AuthService;
import com.finguard.api.service.ExpenseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/expense")
@Tag(name = "Expense Management Module", description = "Endpoints for logging, tracking, updating, and reviewing expenses.")
public class ExpenseController {

    private final ExpenseService expenseService;
    private final AuthService authService;

    public ExpenseController(ExpenseService expenseService, AuthService authService) {
        this.expenseService = expenseService;
        this.authService = authService;
    }

    @PostMapping
    @Operation(summary = "Add an expense record", description = "Logs a new expense, mirrors it to the ledger, triggers AI fraud analysis, and updates FSI score.")
    public ResponseEntity<Expense> addExpense(Principal principal, @Valid @RequestBody ExpenseRequest request) {
        User user = authService.getAuthenticatedUser(principal.getName());
        return ResponseEntity.ok(expenseService.addExpense(request, user));
    }

    @GetMapping
    @Operation(summary = "View user expense history", description = "Retrieves all logged expenses for the authenticated account, sorted newest first.")
    public ResponseEntity<List<Expense>> getExpenses(Principal principal) {
        User user = authService.getAuthenticatedUser(principal.getName());
        return ResponseEntity.ok(expenseService.getUserExpenses(user));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an expense record", description = "Updates details of a logged expense, synchronization ledger, and triggers FSI recalculations.")
    public ResponseEntity<Expense> updateExpense(Principal principal, @PathVariable Long id, @Valid @RequestBody ExpenseRequest request) {
        User user = authService.getAuthenticatedUser(principal.getName());
        return ResponseEntity.ok(expenseService.updateExpense(id, request, user));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an expense record", description = "Deletes a logged expense, pulls it from the transaction ledger, and triggers FSI recalculations.")
    public ResponseEntity<Void> deleteExpense(Principal principal, @PathVariable Long id) {
        User user = authService.getAuthenticatedUser(principal.getName());
        expenseService.deleteExpense(id, user);
        return ResponseEntity.noContent().build();
    }
}
