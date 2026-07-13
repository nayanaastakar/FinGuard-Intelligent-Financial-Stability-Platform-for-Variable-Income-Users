package com.finguard.api.controller;

import com.finguard.api.dto.AuthResponse;
import com.finguard.api.dto.LoginRequest;
import com.finguard.api.dto.ProfileUpdateRequest;
import com.finguard.api.dto.RegisterRequest;
import com.finguard.api.entity.User;
import com.finguard.api.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication Module", description = "Endpoints for user onboarding, token issuance, and profile synchronization.")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user profile", description = "Creates a secure user account, hashes credentials using BCrypt, and returns a JWT session token.")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user credentials", description = "Verifies username/password match and returns a JWT security token.")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/profile")
    @Operation(summary = "Get current authenticated user profile", description = "Decrypts session JWT to extract and return user account metadata.")
    public ResponseEntity<User> getProfile(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(authService.getAuthenticatedUser(principal.getName()));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update user profile details", description = "Allows updating user's full name, profession, and target savings goal.")
    public ResponseEntity<User> updateProfile(Principal principal, @Valid @RequestBody ProfileUpdateRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(authService.updateProfile(principal.getName(), request));
    }
}
