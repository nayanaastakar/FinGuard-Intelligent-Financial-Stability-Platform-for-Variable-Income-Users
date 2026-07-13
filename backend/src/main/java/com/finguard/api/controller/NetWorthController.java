package com.finguard.api.controller;

import com.finguard.api.dto.AssetRequest;
import com.finguard.api.dto.LiabilityRequest;
import com.finguard.api.entity.Asset;
import com.finguard.api.entity.Liability;
import com.finguard.api.entity.User;
import com.finguard.api.repository.AssetRepository;
import com.finguard.api.repository.LiabilityRepository;
import com.finguard.api.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/networth")
public class NetWorthController {

    private final AssetRepository assetRepository;
    private final LiabilityRepository liabilityRepository;
    private final UserRepository userRepository;

    public NetWorthController(AssetRepository assetRepository, LiabilityRepository liabilityRepository, UserRepository userRepository) {
        this.assetRepository = assetRepository;
        this.liabilityRepository = liabilityRepository;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(Authentication authentication) {
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping("/assets")
    public ResponseEntity<List<Asset>> getAssets(Authentication authentication) {
        return ResponseEntity.ok(assetRepository.findByUser(getAuthenticatedUser(authentication)));
    }

    @PostMapping("/assets")
    public ResponseEntity<Asset> addAsset(@RequestBody AssetRequest request, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        Asset asset = new Asset();
        asset.setUser(user);
        asset.setName(request.name());
        asset.setType(request.type());
        asset.setValue(request.value());
        asset.setDate(request.date());
        return ResponseEntity.ok(assetRepository.save(asset));
    }

    @DeleteMapping("/assets/{id}")
    public ResponseEntity<Void> deleteAsset(@PathVariable Long id, Authentication authentication) {
        Asset asset = assetRepository.findById(id).orElseThrow();
        if (!asset.getUser().getId().equals(getAuthenticatedUser(authentication).getId())) {
            return ResponseEntity.status(403).build();
        }
        assetRepository.delete(asset);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/liabilities")
    public ResponseEntity<List<Liability>> getLiabilities(Authentication authentication) {
        return ResponseEntity.ok(liabilityRepository.findByUser(getAuthenticatedUser(authentication)));
    }

    @PostMapping("/liabilities")
    public ResponseEntity<Liability> addLiability(@RequestBody LiabilityRequest request, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        Liability liability = new Liability();
        liability.setUser(user);
        liability.setName(request.name());
        liability.setType(request.type());
        liability.setValue(request.value());
        liability.setInterestRate(request.interestRate());
        liability.setDate(request.date());
        return ResponseEntity.ok(liabilityRepository.save(liability));
    }

    @DeleteMapping("/liabilities/{id}")
    public ResponseEntity<Void> deleteLiability(@PathVariable Long id, Authentication authentication) {
        Liability liability = liabilityRepository.findById(id).orElseThrow();
        if (!liability.getUser().getId().equals(getAuthenticatedUser(authentication).getId())) {
            return ResponseEntity.status(403).build();
        }
        liabilityRepository.delete(liability);
        return ResponseEntity.noContent().build();
    }
}
