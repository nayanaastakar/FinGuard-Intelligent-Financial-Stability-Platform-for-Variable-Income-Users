package com.finguard.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "application.ai")
public class AiProperties {

    private boolean enabled = true;
    private String provider = "gemini";
    private String apiKey = "";
    private String model = "gemini-1.5-flash";
    private String baseUrl = "https://generativelanguage.googleapis.com/v1beta";
    private int maxHistoryMessages = 8;
    private int timeoutSeconds = 45;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public int getMaxHistoryMessages() {
        return maxHistoryMessages;
    }

    public void setMaxHistoryMessages(int maxHistoryMessages) {
        this.maxHistoryMessages = maxHistoryMessages;
    }

    public int getTimeoutSeconds() {
        return timeoutSeconds;
    }

    public void setTimeoutSeconds(int timeoutSeconds) {
        this.timeoutSeconds = timeoutSeconds;
    }

    public boolean hasCredentials() {
        if ("ollama".equalsIgnoreCase(provider) || "algorithmic".equalsIgnoreCase(provider)) {
            return true;
        }
        return apiKey != null && !apiKey.isBlank();
    }
}
