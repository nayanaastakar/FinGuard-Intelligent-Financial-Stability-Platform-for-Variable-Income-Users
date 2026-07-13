package com.finguard.api.repository;

import com.finguard.api.entity.SavingsGoal;
import com.finguard.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavingsGoalRepository extends JpaRepository<SavingsGoal, Long> {
    List<SavingsGoal> findByUser(User user);
    List<SavingsGoal> findByUserAndStatus(User user, String status);
    Optional<SavingsGoal> findByUserAndName(User user, String name);
}
