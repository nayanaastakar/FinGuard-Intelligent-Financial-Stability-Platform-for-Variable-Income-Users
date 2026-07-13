package com.finguard.api.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "fraud_alerts")
public class FraudAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", nullable = true)
    private Transaction transaction;

    @Column(nullable = false)
    private String alertType; // e.g. LARGE_OUTLIER, VELOCITY_SPIKE, CATEGORY_ANOMALY

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private String status = "ACTIVE"; // e.g. ACTIVE, INVESTIGATED, DISMISSED

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public FraudAlert() {
    }

    public FraudAlert(Long id, User user, Transaction transaction, String alertType, String description, String status, LocalDateTime createdAt) {
        this.id = id;
        this.user = user;
        this.transaction = transaction;
        this.alertType = alertType;
        this.description = description;
        this.status = status;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Transaction getTransaction() { return transaction; }
    public void setTransaction(Transaction transaction) { this.transaction = transaction; }

    public String getAlertType() { return alertType; }
    public void setAlertType(String alertType) { this.alertType = alertType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
