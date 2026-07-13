package com.finguard.api.repository;

import com.finguard.api.entity.FraudAlert;
import com.finguard.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FraudAlertRepository extends JpaRepository<FraudAlert, Long> {
    List<FraudAlert> findByUserOrderByCreatedAtDesc(User user);
}
