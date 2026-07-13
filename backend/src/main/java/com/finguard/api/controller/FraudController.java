package com.finguard.api.controller;

import com.finguard.api.dto.FraudAlertResponse;
import com.finguard.api.entity.User;
import com.finguard.api.service.AuthService;
import com.finguard.api.service.FraudDetectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/fraud")
@Tag(name = "Fraud & Anomaly Detection Module", description = "Endpoints for reviewing transaction anomalies, velocity spikes, and resolving fraud notifications.")
public class FraudController {

    private final FraudDetectionService fraudDetectionService;
    private final AuthService authService;

    public FraudController(FraudDetectionService fraudDetectionService, AuthService authService) {
        this.fraudDetectionService = fraudDetectionService;
        this.authService = authService;
    }

    @GetMapping("/alerts")
    @Operation(summary = "View suspicious transaction alerts", description = "Retrieves all security warnings generated on historical transaction behavior.")
    public ResponseEntity<List<FraudAlertResponse>> getFraudAlerts(Principal principal) {
        User user = authService.getAuthenticatedUser(principal.getName());
        return ResponseEntity.ok(fraudDetectionService.getUserFraudAlerts(user));
    }

    @PutMapping("/alerts/{id}/resolve")
    @Operation(summary = "Resolve or dismiss a flagged alert", description = "Updates a security flag's status (e.g., RESOLVED, DISMISSED, INVESTIGATING).")
    public ResponseEntity<Void> resolveAlert(Principal principal, @PathVariable Long id, @RequestParam String status) {
        User user = authService.getAuthenticatedUser(principal.getName());
        fraudDetectionService.resolveAlert(id, status, user);
        return ResponseEntity.ok().build();
    }
}
