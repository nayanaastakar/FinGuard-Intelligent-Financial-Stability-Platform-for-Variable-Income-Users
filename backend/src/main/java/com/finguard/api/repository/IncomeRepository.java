package com.finguard.api.repository;

import com.finguard.api.entity.Income;
import com.finguard.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncomeRepository extends JpaRepository<Income, Long> {
    List<Income> findByUser(User user);
    List<Income> findByUserOrderByDateDesc(User user);
}
