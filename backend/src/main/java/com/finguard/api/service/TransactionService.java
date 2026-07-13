package com.finguard.api.service;

import com.finguard.api.dto.TransactionDto;
import com.finguard.api.entity.Transaction;
import com.finguard.api.entity.User;
import com.finguard.api.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;

    public TransactionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public Transaction logTransaction(User user, String type, Double amount, String category, LocalDate date, String description, Long referenceId) {
        return logTransaction(user, type, amount, category, date, description, null, null, null, referenceId);
    }

    @Transactional
    public Transaction logTransaction(User user, String type, Double amount, String category, LocalDate date, String description,
                                      String accountName, String accountType, String upiId, Long referenceId) {
        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setType(type);
        transaction.setAmount(amount);
        transaction.setCategory(category);
        transaction.setDate(date);
        transaction.setDescription(description);
        transaction.setAccountName(accountName);
        transaction.setAccountType(accountType);
        transaction.setUpiId(upiId);
        transaction.setReferenceId(referenceId);
        return transactionRepository.save(transaction);
    }

    @Transactional
    public void updateTransaction(Long referenceId, String type, Double amount, String category, LocalDate date, String description) {
        updateTransaction(referenceId, type, amount, category, date, description, null, null, null);
    }

    @Transactional
    public void updateTransaction(Long referenceId, String type, Double amount, String category, LocalDate date, String description,
                                  String accountName, String accountType, String upiId) {
        List<Transaction> transactions = transactionRepository.findAll();
        for (Transaction t : transactions) {
            if (referenceId.equals(t.getReferenceId()) && type.equalsIgnoreCase(t.getType())) {
                t.setAmount(amount);
                t.setCategory(category);
                t.setDate(date);
                t.setDescription(description);
                t.setAccountName(accountName);
                t.setAccountType(accountType);
                t.setUpiId(upiId);
                transactionRepository.save(t);
                break;
            }
        }
    }

    @Transactional
    public void deleteTransaction(Long referenceId, String type) {
        List<Transaction> transactions = transactionRepository.findAll();
        for (Transaction t : transactions) {
            if (referenceId.equals(t.getReferenceId()) && type.equalsIgnoreCase(t.getType())) {
                transactionRepository.delete(t);
                break;
            }
        }
    }

    public List<TransactionDto> getUserTransactions(User user) {
        return transactionRepository.findByUserOrderByDateDesc(user)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public TransactionDto mapToDto(Transaction transaction) {
        return new TransactionDto(
                transaction.getId(),
                transaction.getType(),
                transaction.getAmount(),
                transaction.getCategory(),
                transaction.getDate(),
                transaction.getDescription(),
                transaction.getAccountName(),
                transaction.getAccountType(),
                transaction.getUpiId()
        );
    }
}
