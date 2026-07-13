package com.finguard.api.controller;

import com.finguard.api.dto.StabilityResponse;
import com.finguard.api.entity.User;
import com.finguard.api.service.AuthService;
import com.finguard.api.service.StabilityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/stability")
@Tag(name = "Financial Stability AI Module", description = "Endpoints for triggering and retrieving FSI scores, savings potential predictions, and AI advisor suggestion scripts.")
public class StabilityController {

    private final StabilityService stabilityService;
    private final AuthService authService;

    public StabilityController(StabilityService stabilityService, AuthService authService) {
        this.stabilityService = stabilityService;
        this.authService = authService;
    }

    @GetMapping
    @Operation(summary = "Calculate and retrieve financial stability scores", description = "Extracts full income/expense history, processes volatility indices, and formats personalized suggestions.")
    public ResponseEntity<StabilityResponse> getStabilityMetrics(Principal principal) {
        User user = authService.getAuthenticatedUser(principal.getName());
        return ResponseEntity.ok(stabilityService.calculateStability(user));
    }
}
