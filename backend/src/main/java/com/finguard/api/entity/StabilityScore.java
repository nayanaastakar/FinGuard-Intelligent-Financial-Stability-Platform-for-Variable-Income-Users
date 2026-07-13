package com.finguard.api.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stability_scores")
public class StabilityScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Double score; // 0.0 to 100.0

    @Column(nullable = false)
    private Double savingsPotential;

    @Column(nullable = false)
    private String riskLevel; // LOW, MEDIUM, HIGH

    @Lob
    @Column(columnDefinition = "TEXT")
    private String aiSuggestions;

    @Column(nullable = false)
    private LocalDateTime calculatedAt = LocalDateTime.now();

    public StabilityScore() {
    }

    public StabilityScore(Long id, User user, Double score, Double savingsPotential, String riskLevel, String aiSuggestions, LocalDateTime calculatedAt) {
        this.id = id;
        this.user = user;
        this.score = score;
        this.savingsPotential = savingsPotential;
        this.riskLevel = riskLevel;
        this.aiSuggestions = aiSuggestions;
        this.calculatedAt = calculatedAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    public Double getSavingsPotential() { return savingsPotential; }
    public void setSavingsPotential(Double savingsPotential) { this.savingsPotential = savingsPotential; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public String getAiSuggestions() { return aiSuggestions; }
    public void setAiSuggestions(String aiSuggestions) { this.aiSuggestions = aiSuggestions; }

    public LocalDateTime getCalculatedAt() { return calculatedAt; }
    public void setCalculatedAt(LocalDateTime calculatedAt) { this.calculatedAt = calculatedAt; }
}
