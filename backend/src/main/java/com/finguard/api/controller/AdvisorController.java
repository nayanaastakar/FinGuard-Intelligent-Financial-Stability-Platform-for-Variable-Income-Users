package com.finguard.api.controller;

import com.finguard.api.dto.AdvisorChatRequest;
import com.finguard.api.dto.AdvisorChatResponse;
import com.finguard.api.entity.User;
import com.finguard.api.service.AiAdvisorService;
import com.finguard.api.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/advisor")
@Tag(name = "AI Advisor Module", description = "Real LLM-powered financial copilot with user-context grounding and safe fallback.")
public class AdvisorController {

    private final AiAdvisorService aiAdvisorService;
    private final AuthService authService;

    public AdvisorController(AiAdvisorService aiAdvisorService, AuthService authService) {
        this.aiAdvisorService = aiAdvisorService;
        this.authService = authService;
    }

    @PostMapping("/chat")
    @Operation(summary = "Chat with FinGuard API Advisor",
            description = "Uses OpenAI, Gemini, or Ollama when configured. Falls back to rule-based advisor if no API key is set.")
    public ResponseEntity<AdvisorChatResponse> chat(@Valid @RequestBody AdvisorChatRequest request, Principal principal) {
        User user = authService.getAuthenticatedUser(principal.getName());
        return ResponseEntity.ok(aiAdvisorService.chat(user, request));
    }
}
