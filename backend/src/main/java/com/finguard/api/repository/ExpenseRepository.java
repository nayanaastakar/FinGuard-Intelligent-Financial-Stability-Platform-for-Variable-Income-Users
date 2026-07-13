package com.finguard.api.repository;

import com.finguard.api.entity.Expense;
import com.finguard.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByUser(User user);
    List<Expense> findByUserOrderByDateDesc(User user);
}
