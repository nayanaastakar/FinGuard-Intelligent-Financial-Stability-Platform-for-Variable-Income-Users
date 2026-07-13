package com.finguard.api.repository;

import com.finguard.api.entity.StabilityScore;
import com.finguard.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StabilityScoreRepository extends JpaRepository<StabilityScore, Long> {
    List<StabilityScore> findByUserOrderByCalculatedAtDesc(User user);
    void deleteByUser(User user);
}
