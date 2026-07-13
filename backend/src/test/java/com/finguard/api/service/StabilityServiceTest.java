package com.finguard.api.service;

import com.finguard.api.dto.StabilityResponse;
import com.finguard.api.entity.User;
import com.finguard.api.entity.Role;
import com.finguard.api.entity.Income;
import com.finguard.api.entity.Expense;
import com.finguard.api.repository.IncomeRepository;
import com.finguard.api.repository.ExpenseRepository;
import com.finguard.api.repository.AssetRepository;
import com.finguard.api.repository.LiabilityRepository;
import com.finguard.api.repository.NotificationRepository;
import com.finguard.api.repository.StabilityScoreRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class StabilityServiceTest {

    @Mock
    private IncomeRepository incomeRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private AssetRepository assetRepository;

    @Mock
    private LiabilityRepository liabilityRepository;

    @Mock
    private StabilityScoreRepository stabilityScoreRepository;

    @Mock
    private NotificationRepository notificationRepository;

    private StabilityService stabilityService;

    private User user;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        NotificationService notificationService = new NotificationService(notificationRepository);
        ForecastService forecastService = new ForecastService();
        stabilityService = new StabilityService(
            incomeRepository,
            expenseRepository,
            assetRepository,
            liabilityRepository,
            stabilityScoreRepository,
            notificationService,
            forecastService
        );

        user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setFullName("Test User");
        user.setProfession("Freelancer");
        user.setTargetSavings(1000.0);
    }

    @Test
    void testCalculateStabilityWithNoIncomeRecords() {
        when(incomeRepository.findByUser(user)).thenReturn(new ArrayList<>());
        when(expenseRepository.findByUser(user)).thenReturn(new ArrayList<>());

        StabilityResponse response = stabilityService.calculateStability(user);

        assertNotNull(response);
        assertEquals(70.0, response.score());
        assertEquals(0.0, response.savingsPotential());
        assertEquals("LOW", response.riskLevel());
        assertTrue(response.aiSuggestions().contains("Welcome! Start adding"));
    }

    @Test
    void testCalculateStabilityWithHealthyMargins() {
        List<Income> incomes = List.of(
                new Income(1L, user, 3000.0, "FREELANCE", "Upwork", LocalDate.now().minusDays(10), "Deposit 1"),
                new Income(2L, user, 3000.0, "FREELANCE", "Fiverr", LocalDate.now().minusDays(5), "Deposit 2")
        );
        List<Expense> expenses = List.of(
                new Expense(1L, user, 1000.0, "RENT", LocalDate.now().minusDays(8), "Rent payment"),
                new Expense(2L, user, 500.0, "FOOD", LocalDate.now().minusDays(4), "Food bill")
        );

        when(incomeRepository.findByUser(user)).thenReturn(incomes);
        when(expenseRepository.findByUser(user)).thenReturn(expenses);

        StabilityResponse response = stabilityService.calculateStability(user);

        assertNotNull(response);
        assertTrue(response.score() > 50.0);
        assertEquals(500.0, response.savingsPotential());
        assertEquals("MEDIUM", response.riskLevel());
        verify(stabilityScoreRepository, times(1)).save(any());
    }
}
