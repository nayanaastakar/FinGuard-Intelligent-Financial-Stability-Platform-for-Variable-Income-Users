package com.finguard.api.service;

import com.finguard.api.dto.FraudAlertResponse;
import com.finguard.api.entity.FraudAlert;
import com.finguard.api.entity.Transaction;
import com.finguard.api.entity.User;
import com.finguard.api.exception.ResourceNotFoundException;
import com.finguard.api.repository.FraudAlertRepository;
import com.finguard.api.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FraudDetectionService {

    private final FraudAlertRepository fraudAlertRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationService notificationService;

    public FraudDetectionService(FraudAlertRepository fraudAlertRepository,
                                 TransactionRepository transactionRepository,
                                 NotificationService notificationService) {
        this.fraudAlertRepository = fraudAlertRepository;
        this.transactionRepository = transactionRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public void analyzeTransaction(Transaction transaction) {
        // Anomaly analysis is only relevant for Expense transactions
        if (!"EXPENSE".equalsIgnoreCase(transaction.getType())) {
            return;
        }

        User user = transaction.getUser();
        Double amount = transaction.getAmount();
        List<Transaction> history = transactionRepository.findByUser(user);

        // Filter out the current transaction from historical comparison
        List<Transaction> pastExpenses = history.stream()
                .filter(t -> "EXPENSE".equalsIgnoreCase(t.getType()) && !t.getId().equals(transaction.getId()))
                .collect(Collectors.toList());

        if (pastExpenses.isEmpty()) {
            return; // No history to compare against yet
        }

        // Heuristic 1: Outlier Detection (2.5x standard average size)
        double totalExpenseAmount = pastExpenses.stream().mapToDouble(Transaction::getAmount).sum();
        double averageExpense = totalExpenseAmount / pastExpenses.size();

        if (amount > 1000 && amount > (2.5 * averageExpense)) {
            triggerAlert(transaction, "LARGE_OUTLIER",
                    String.format("Transaction of Rs %.2f in %s exceeds your historical expense average (Rs %.2f) by over 250%%.",
                            amount, transaction.getCategory(), averageExpense));
        }

        // Heuristic 2: Velocity / Double Charge Check
        long duplicateCount = pastExpenses.stream()
                .filter(t -> t.getDate().equals(transaction.getDate()) &&
                             t.getAmount().equals(transaction.getAmount()) &&
                             t.getCategory().equalsIgnoreCase(transaction.getCategory()))
                .count();

        if (duplicateCount >= 2) {
            triggerAlert(transaction, "VELOCITY_SPIKE",
                    String.format("Possible duplicate transaction detected! Multiple identical charges of Rs %.2f in '%s' on %s.",
                            amount, transaction.getCategory(), transaction.getDate()));
        }
    }

    private void triggerAlert(Transaction transaction, String alertType, String description) {
        User user = transaction.getUser();

        FraudAlert alert = new FraudAlert();
        alert.setUser(user);
        alert.setTransaction(transaction);
        alert.setAlertType(alertType);
        alert.setDescription(description);
        alert.setStatus("ACTIVE");
        fraudAlertRepository.save(alert);

        // Generate immediate corresponding push notification
        notificationService.createNotification(
                user,
                "Suspicious Activity Detected",
                description,
                "FRAUD"
        );
    }

    public List<FraudAlertResponse> getUserFraudAlerts(User user) {
        return fraudAlertRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void resolveAlert(Long id, String status, User user) {
        FraudAlert alert = fraudAlertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fraud alert not found"));
        if (!alert.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Fraud alert not found");
        }
        alert.setStatus(status); // RESOLVED, DISMISSED, INVESTIGATING
        fraudAlertRepository.save(alert);
    }

    public FraudAlertResponse mapToResponse(FraudAlert alert) {
        Transaction transaction = alert.getTransaction();
        Long txId = transaction != null ? transaction.getId() : null;
        Double txAmount = transaction != null ? transaction.getAmount() : 0.0;
        String txCat = transaction != null ? transaction.getCategory() : "UNKNOWN";

        return new FraudAlertResponse(
                alert.getId(),
                alert.getAlertType(),
                alert.getDescription(),
                alert.getStatus(),
                alert.getCreatedAt(),
                txId,
                txAmount,
                txCat
        );
    }
}
