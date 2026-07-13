package com.finguard.api.repository;

import com.finguard.api.entity.Asset;
import com.finguard.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetRepository extends JpaRepository<Asset, Long> {
    List<Asset> findByUser(User user);
}
