package com.finguard.api.service;

import com.finguard.api.config.JwtService;
import com.finguard.api.dto.AuthResponse;
import com.finguard.api.dto.LoginRequest;
import com.finguard.api.dto.ProfileUpdateRequest;
import com.finguard.api.dto.RegisterRequest;
import com.finguard.api.entity.Role;
import com.finguard.api.entity.User;
import com.finguard.api.exception.BadRequestException;
import com.finguard.api.exception.ResourceNotFoundException;
import com.finguard.api.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new BadRequestException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Email is already registered");
        }

        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName());
        user.setRole(Role.USER);
        user.setProfession(request.profession() != null ? request.profession() : "Freelancer");
        user.setTargetSavings(request.targetSavings() != null ? request.targetSavings() : 1000.0);
        user.setRoundUpBucketThreshold(request.roundUpBucketThreshold() != null ? request.roundUpBucketThreshold() : 50.0);

        User savedUser = userRepository.save(user);
        String jwtToken = jwtService.generateToken(savedUser);

        return new AuthResponse(
                jwtToken,
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getEmail(),
                savedUser.getFullName(),
                savedUser.getRole().name(),
                savedUser.getProfession(),
                savedUser.getTargetSavings(),
                savedUser.getAutoRoundUpEnabled(),
                savedUser.getRoundUpBucketThreshold()
        );
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.username(),
                        request.password()
                )
        );

        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        String jwtToken = jwtService.generateToken(user);

        return new AuthResponse(
                jwtToken,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getRole().name(),
                user.getProfession(),
                user.getTargetSavings(),
                user.getAutoRoundUpEnabled(),
                user.getRoundUpBucketThreshold()
        );
    }

    public User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional
    public User updateProfile(String username, ProfileUpdateRequest request) {
        User user = getAuthenticatedUser(username);
        user.setFullName(request.fullName());
        user.setProfession(request.profession());
        if (request.targetSavings() != null) {
            user.setTargetSavings(request.targetSavings());
        }
        if (request.autoRoundUpEnabled() != null) {
            user.setAutoRoundUpEnabled(request.autoRoundUpEnabled());
        }
        if (request.roundUpBucketThreshold() != null) {
            user.setRoundUpBucketThreshold(request.roundUpBucketThreshold());
        }
        return userRepository.save(user);
    }
}
