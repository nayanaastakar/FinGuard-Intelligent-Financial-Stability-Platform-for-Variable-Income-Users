package com.finguard.api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private String profession;

    private Double targetSavings = 1000.0;
    private Double roundUpBucketThreshold = 50.0;
    private Boolean autoRoundUpEnabled = false;

    private LocalDateTime createdAt = LocalDateTime.now();

    public User() {
    }

    public User(Long id, String username, String email, String password, String fullName, Role role, String profession, Double targetSavings) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.role = role;
        this.profession = profession;
        this.targetSavings = targetSavings;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Boolean getAutoRoundUpEnabled() { return autoRoundUpEnabled != null ? autoRoundUpEnabled : false; }
    public void setAutoRoundUpEnabled(Boolean autoRoundUpEnabled) { this.autoRoundUpEnabled = autoRoundUpEnabled; }


    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    @JsonIgnore
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getProfession() { return profession; }
    public void setProfession(String profession) { this.profession = profession; }

    public Double getTargetSavings() { return targetSavings; }
    public void setTargetSavings(Double targetSavings) { this.targetSavings = targetSavings; }

    public Double getRoundUpBucketThreshold() { return roundUpBucketThreshold != null ? roundUpBucketThreshold : 50.0; }
    public void setRoundUpBucketThreshold(Double roundUpBucketThreshold) { this.roundUpBucketThreshold = roundUpBucketThreshold; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // UserDetails implementations
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }
}
