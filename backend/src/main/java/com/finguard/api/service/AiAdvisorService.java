package com.finguard.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.finguard.api.config.AiProperties;
import com.finguard.api.dto.*;
import com.finguard.api.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class AiAdvisorService {

    private static final Logger log = LoggerFactory.getLogger(AiAdvisorService.class);

    private final AiProperties aiProperties;
    private final DashboardService dashboardService;
    private final StabilityService stabilityService;
    private final AdvisorFallbackService fallbackService;
    private final AdvisorAlgorithmicService algorithmicService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public AiAdvisorService(AiProperties aiProperties,
                            DashboardService dashboardService,
                            StabilityService stabilityService,
                            AdvisorFallbackService fallbackService,
                            AdvisorAlgorithmicService algorithmicService,
                            ObjectMapper objectMapper) {
        this.aiProperties = aiProperties;
        this.dashboardService = dashboardService;
        this.stabilityService = stabilityService;
        this.fallbackService = fallbackService;
        this.algorithmicService = algorithmicService;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    public AdvisorChatResponse chat(User user, AdvisorChatRequest request) {
        DashboardSummary dashboard = dashboardService.getDashboardSummary(user);
        StabilityResponse stability = stabilityService.calculateStability(user);
        String systemPrompt = buildSystemPrompt(user, dashboard, stability);

        if (aiProperties.isEnabled() && aiProperties.hasCredentials()) {
            try {
                String reply = callProvider(systemPrompt, user, request, dashboard, stability);
                if (reply != null && !reply.isBlank()) {
                    boolean realAi = !"algorithmic".equalsIgnoreCase(aiProperties.getProvider());
                    return new AdvisorChatResponse(reply.trim(), aiProperties.getProvider(), realAi);
                }
            } catch (Exception ex) {
                log.warn("Real AI advisor call failed, using fallback: {}", ex.getMessage());
            }
        }

        String fallback = fallbackService.buildFallbackReply(user, request.message(), dashboard, stability);
        return new AdvisorChatResponse(fallback, "fallback", false);
    }

    private String buildSystemPrompt(User user, DashboardSummary dashboard, StabilityResponse stability) {
        long activeAlerts = dashboard.fraudAlerts() == null ? 0
                : dashboard.fraudAlerts().stream().filter(a -> "ACTIVE".equalsIgnoreCase(a.status())).count();

        return """
                You are FinGuard API, an expert financial advisor for Indian freelancers, gig workers, and variable-income professionals.

                User profile:
                - Name: %s
                - Profession: %s
                - Target savings: ₹%.0f/month

                Live financial data (INR):
                - Total income: ₹%.2f
                - Total expense: ₹%.2f
                - Balance: ₹%.2f
                - FSI score: %.1f/100
                - Risk level: %s
                - Savings potential: ₹%.2f/month
                - Income volatility index: %.2f
                - Active fraud/anomaly alerts: %d

                Stability report excerpt:
                %s

                Rules:
                - Use ₹ and Indian context (UPI, SIP, RD, gig work, Sahamati AA).
                - Be practical, empathetic, and action-oriented for volatile income.
                - Format with markdown: ### headings, **bold**, numbered lists.
                - Keep answers under 350 words unless user asks for a detailed plan.
                - Never invent transaction amounts beyond the data above.
                - Do not claim to execute trades or move money.
                """.formatted(
                user.getFullName(),
                user.getProfession(),
                user.getTargetSavings() != null ? user.getTargetSavings() : 0,
                dashboard.totalIncome() != null ? dashboard.totalIncome() : 0,
                dashboard.totalExpense() != null ? dashboard.totalExpense() : 0,
                dashboard.balance() != null ? dashboard.balance() : 0,
                dashboard.stabilityScore() != null ? dashboard.stabilityScore() : 0,
                dashboard.riskLevel() != null ? dashboard.riskLevel() : "UNKNOWN",
                dashboard.savingsPotential() != null ? dashboard.savingsPotential() : 0,
                stability.volatilityIndex() != null ? stability.volatilityIndex() : 0,
                activeAlerts,
                stability.aiSuggestions() != null ? stability.aiSuggestions() : "No additional report."
        );
    }

    private String callProvider(String systemPrompt, User user, AdvisorChatRequest request,
                                DashboardSummary dashboard, StabilityResponse stability) throws Exception {
        String provider = aiProperties.getProvider().toLowerCase(Locale.ROOT);
        return switch (provider) {
            case "openai" -> callOpenAiCompatible(systemPrompt, request);
            case "gemini" -> callGemini(systemPrompt, request);
            case "ollama" -> callOllama(systemPrompt, request);
            case "algorithmic" -> callAlgorithmic(user, request, dashboard, stability);
            default -> throw new IllegalArgumentException("Unsupported AI provider: " + provider);
        };
    }

    private String callOpenAiCompatible(String systemPrompt, AdvisorChatRequest request) throws Exception {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", aiProperties.getModel());
        body.put("temperature", 0.4);

        ArrayNode messages = body.putArray("messages");
        messages.addObject().put("role", "system").put("content", systemPrompt);
        appendHistory(messages, request.history());
        messages.addObject().put("role", "user").put("content", request.message());

        String baseUrl = aiProperties.getBaseUrl();
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "https://api.openai.com/v1";
        }
        String url = baseUrl.endsWith("/") ? baseUrl + "chat/completions" : baseUrl + "/chat/completions";

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(aiProperties.getTimeoutSeconds()))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + aiProperties.getApiKey())
                .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                .build();

        JsonNode response = executeJson(httpRequest);
        return response.path("choices").path(0).path("message").path("content").asText(null);
    }

    private String callGemini(String systemPrompt, AdvisorChatRequest request) throws Exception {
        ObjectNode body = objectMapper.createObjectNode();
        ObjectNode systemInstruction = body.putObject("systemInstruction");
        systemInstruction.putArray("parts").addObject().put("text", systemPrompt);

        ArrayNode contents = body.putArray("contents");
        appendGeminiHistory(contents, request.history());
        contents.addObject()
                .put("role", "user")
                .putArray("parts")
                .addObject()
                .put("text", request.message());

        ObjectNode generationConfig = body.putObject("generationConfig");
        generationConfig.put("temperature", 0.4);
        generationConfig.put("maxOutputTokens", 1024);

        String baseUrl = aiProperties.getBaseUrl();
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "https://generativelanguage.googleapis.com/v1beta";
        }
        String model = aiProperties.getModel();
        String url = "%s/models/%s:generateContent?key=%s".formatted(
                baseUrl.replaceAll("/$", ""), model, aiProperties.getApiKey());

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(aiProperties.getTimeoutSeconds()))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                .build();

        JsonNode response = executeJson(httpRequest);
        return response.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText(null);
    }

    private String callOllama(String systemPrompt, AdvisorChatRequest request) throws Exception {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", aiProperties.getModel());
        body.put("stream", false);

        ArrayNode messages = body.putArray("messages");
        messages.addObject().put("role", "system").put("content", systemPrompt);
        appendHistory(messages, request.history());
        messages.addObject().put("role", "user").put("content", request.message());

        String baseUrl = aiProperties.getBaseUrl();
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "http://localhost:11434";
        }
        String url = baseUrl.replaceAll("/$", "") + "/api/chat";

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(aiProperties.getTimeoutSeconds()))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                .build();

        JsonNode response = executeJson(httpRequest);
        return response.path("message").path("content").asText(null);
    }

    private String callAlgorithmic(User user, AdvisorChatRequest request, DashboardSummary dashboard,
                                   StabilityResponse stability) {
        return algorithmicService.buildAlgorithmicReply(user, request.message(), dashboard, stability);
    }

    private void appendHistory(ArrayNode messages, List<AdvisorChatMessageDto> history) {
        if (history == null) {
            return;
        }
        List<AdvisorChatMessageDto> trimmed = trimHistory(history);
        for (AdvisorChatMessageDto item : trimmed) {
            String role = normalizeRole(item.role());
            if (role == null || item.content() == null || item.content().isBlank()) {
                continue;
            }
            messages.addObject().put("role", role).put("content", item.content());
        }
    }

    private void appendGeminiHistory(ArrayNode contents, List<AdvisorChatMessageDto> history) {
        if (history == null) {
            return;
        }
        for (AdvisorChatMessageDto item : trimHistory(history)) {
            String role = "assistant".equals(normalizeRole(item.role())) ? "model" : "user";
            if (item.content() == null || item.content().isBlank()) {
                continue;
            }
            contents.addObject()
                    .put("role", role)
                    .putArray("parts")
                    .addObject()
                    .put("text", item.content());
        }
    }

    private List<AdvisorChatMessageDto> trimHistory(List<AdvisorChatMessageDto> history) {
        int max = Math.max(0, aiProperties.getMaxHistoryMessages());
        if (history.size() <= max) {
            return history;
        }
        return new ArrayList<>(history.subList(history.size() - max, history.size()));
    }

    private String normalizeRole(String role) {
        if (role == null) {
            return null;
        }
        String normalized = role.toLowerCase(Locale.ROOT);
        if ("user".equals(normalized)) {
            return "user";
        }
        if ("assistant".equals(normalized) || "ai".equals(normalized) || "model".equals(normalized)) {
            return "assistant";
        }
        return null;
    }

    private JsonNode executeJson(HttpRequest httpRequest) throws Exception {
        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("AI HTTP " + response.statusCode() + ": " + response.body());
        }
        return objectMapper.readTree(response.body());
    }
}
