package com.finguard.api.service;

import com.finguard.api.dto.IncomeRequest;
import com.finguard.api.entity.Income;
import com.finguard.api.entity.User;
import com.finguard.api.exception.ResourceNotFoundException;
import com.finguard.api.repository.IncomeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class IncomeService {

    private final IncomeRepository incomeRepository;
    private final TransactionService transactionService;
    private final StabilityService stabilityService;

    public IncomeService(IncomeRepository incomeRepository,
                         TransactionService transactionService,
                         StabilityService stabilityService) {
        this.incomeRepository = incomeRepository;
        this.transactionService = transactionService;
        this.stabilityService = stabilityService;
    }

    @Transactional
    public Income addIncome(IncomeRequest request, User user) {
        Income income = new Income();
        income.setUser(user);
        income.setAmount(request.amount());
        income.setCategory(request.category());
        income.setSource(request.source());
        income.setDate(request.date());
        income.setDescription(request.description());

        Income savedIncome = incomeRepository.save(income);

        // Sync to unified Transaction ledger
        transactionService.logTransaction(
                user,
                "INCOME",
                savedIncome.getAmount(),
                savedIncome.getCategory(),
                savedIncome.getDate(),
                savedIncome.getDescription(),
                savedIncome.getId()
        );

        // Trigger real-time stability recalculation
        stabilityService.calculateStability(user);

        return savedIncome;
    }

    @Transactional
    public Income updateIncome(Long id, IncomeRequest request, User user) {
        Income income = incomeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Income record not found"));

        if (!income.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Income record not found");
        }

        income.setAmount(request.amount());
        income.setCategory(request.category());
        income.setSource(request.source());
        income.setDate(request.date());
        income.setDescription(request.description());

        Income updatedIncome = incomeRepository.save(income);

        // Sync to Transaction ledger
        transactionService.updateTransaction(
                updatedIncome.getId(),
                "INCOME",
                updatedIncome.getAmount(),
                updatedIncome.getCategory(),
                updatedIncome.getDate(),
                updatedIncome.getDescription()
        );

        // Recalculate stability
        stabilityService.calculateStability(user);

        return updatedIncome;
    }

    @Transactional
    public void deleteIncome(Long id, User user) {
        Income income = incomeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Income record not found"));

        if (!income.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Income record not found");
        }

        incomeRepository.delete(income);

        // Remove from ledger
        transactionService.deleteTransaction(id, "INCOME");

        // Recalculate stability
        stabilityService.calculateStability(user);
    }

    public List<Income> getUserIncomes(User user) {
        return incomeRepository.findByUserOrderByDateDesc(user);
    }
}
