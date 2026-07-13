package com.finguard.api.controller;

import com.finguard.api.dto.NotificationResponse;
import com.finguard.api.entity.User;
import com.finguard.api.service.AuthService;
import com.finguard.api.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notifications Module", description = "Endpoints for retrieving user alerts, low balance indicators, and marking notifications as read.")
public class NotificationController {

    private final NotificationService notificationService;
    private final AuthService authService;

    public NotificationController(NotificationService notificationService, AuthService authService) {
        this.notificationService = notificationService;
        this.authService = authService;
    }

    @GetMapping
    @Operation(summary = "View account notifications", description = "Retrieves the full push notification feed for the active account, ordered newest first.")
    public ResponseEntity<List<NotificationResponse>> getNotifications(Principal principal) {
        User user = authService.getAuthenticatedUser(principal.getName());
        return ResponseEntity.ok(notificationService.getUserNotifications(user));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark a notification as read", description = "Flags a single notification item in the feed as read.")
    public ResponseEntity<Void> markAsRead(Principal principal, @PathVariable Long id) {
        User user = authService.getAuthenticatedUser(principal.getName());
        notificationService.markAsRead(id, user);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    @Operation(summary = "Mark all notifications as read", description = "Flags the user's complete notification feed as read.")
    public ResponseEntity<Void> markAllAsRead(Principal principal) {
        User user = authService.getAuthenticatedUser(principal.getName());
        notificationService.markAllAsRead(user);
        return ResponseEntity.ok().build();
    }
}
