package com.finguard.api.controller;

import com.finguard.api.dto.IncomeRequest;
import com.finguard.api.entity.Income;
import com.finguard.api.entity.User;
import com.finguard.api.service.AuthService;
import com.finguard.api.service.IncomeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/income")
@Tag(name = "Income Management Module", description = "Endpoints for logging, tracking, updating, and reviewing income records.")
public class IncomeController {

    private final IncomeService incomeService;
    private final AuthService authService;

    public IncomeController(IncomeService incomeService, AuthService authService) {
        this.incomeService = incomeService;
        this.authService = authService;
    }

    @PostMapping
    @Operation(summary = "Add an income record", description = "Logs a new income deposit, automatically links it to the unified ledger, and triggers FSI recalculations.")
    public ResponseEntity<Income> addIncome(Principal principal, @Valid @RequestBody IncomeRequest request) {
        User user = authService.getAuthenticatedUser(principal.getName());
        return ResponseEntity.ok(incomeService.addIncome(request, user));
    }

    @GetMapping
    @Operation(summary = "View user income history", description = "Retrieves all logged income deposits for the authenticated account, sorted newest first.")
    public ResponseEntity<List<Income>> getIncomes(Principal principal) {
        User user = authService.getAuthenticatedUser(principal.getName());
        return ResponseEntity.ok(incomeService.getUserIncomes(user));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an income record", description = "Updates details of a logged deposit, updates transaction sync, and triggers FSI recalculations.")
    public ResponseEntity<Income> updateIncome(Principal principal, @PathVariable Long id, @Valid @RequestBody IncomeRequest request) {
        User user = authService.getAuthenticatedUser(principal.getName());
        return ResponseEntity.ok(incomeService.updateIncome(id, request, user));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an income record", description = "Deletes a logged deposit from records, pulls it from the transaction ledger, and triggers FSI recalculations.")
    public ResponseEntity<Void> deleteIncome(Principal principal, @PathVariable Long id) {
        User user = authService.getAuthenticatedUser(principal.getName());
        incomeService.deleteIncome(id, user);
        return ResponseEntity.noContent().build();
    }
}
