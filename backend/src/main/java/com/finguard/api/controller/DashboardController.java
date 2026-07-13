package com.finguard.api.controller;

import com.finguard.api.dto.DashboardSummary;
import com.finguard.api.entity.User;
import com.finguard.api.service.AuthService;
import com.finguard.api.service.DashboardService;
import com.finguard.api.config.DataInitializer;
import com.finguard.api.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.LocalDate;
import java.util.Optional;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard & Reports Module", description = "Endpoint to retrieve aggregated, high-speed finance dashboards containing stats, charts, notifications, and transactions.")
public class DashboardController {

    private final DashboardService dashboardService;
    private final AuthService authService;
    private final DataInitializer dataInitializer;
    private final UserRepository userRepository;

    public DashboardController(DashboardService dashboardService, AuthService authService, DataInitializer dataInitializer, UserRepository userRepository) {
        this.dashboardService = dashboardService;
        this.authService = authService;
        this.dataInitializer = dataInitializer;
        this.userRepository = userRepository;
    }

    @GetMapping
    @Operation(summary = "Get unified financial dashboard details", description = "Aggregates income/expense sums, category splits, latest transactions, stability scores, risk indices, and notification updates in a single API trip.")
    public ResponseEntity<DashboardSummary> getDashboardSummary(Principal principal) {
        User user = authService.getAuthenticatedUser(principal.getName());
        return ResponseEntity.ok(dashboardService.getDashboardSummary(user));
    }

    @GetMapping("/seed/{username}")
    public ResponseEntity<String> seedDataForUser(@PathVariable String username) {
        Optional<User> optionalUser = userRepository.findByUsername(username);
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            LocalDate today = LocalDate.now();
            dataInitializer.seedUserData(user, today);
            dataInitializer.seedNetWorth(user, today, username);
            dataInitializer.seedSavingsGoals(user, today, username);
            return ResponseEntity.ok("Successfully seeded 180 days of financial data for " + username);
        }
        return ResponseEntity.badRequest().body("User " + username + " not found!");
    }
}
