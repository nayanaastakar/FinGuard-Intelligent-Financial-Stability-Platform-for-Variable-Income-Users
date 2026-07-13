package com.finguard.api.config;

import com.finguard.api.entity.Role;
import com.finguard.api.entity.User;
import com.finguard.api.entity.Asset;
import com.finguard.api.entity.Liability;
import com.finguard.api.entity.SavingsGoal;
import com.finguard.api.dto.IncomeRequest;
import com.finguard.api.dto.ExpenseRequest;
import com.finguard.api.repository.UserRepository;
import com.finguard.api.repository.AssetRepository;
import com.finguard.api.repository.LiabilityRepository;
import com.finguard.api.repository.SavingsGoalRepository;
import com.finguard.api.service.IncomeService;
import com.finguard.api.service.ExpenseService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Random;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final int RENT_MONTHS = 9;
    private static final boolean SIMPLE_SEED = true; // if true, use simplified monthly income entries
    private final Random random = new Random();

    /**
     * Helper to add 1 or 2 income entries per month.
     * baseIncome: primary monthly income amount.
     * If extra flag true, adds a bonus of ~30% of base.
     */
    private void addSimplifiedIncome(User user, LocalDate monthDate, double baseIncome) {
        // 30% chance of NO primary income to simulate gig-worker droughts for Croston's Method
        if (random.nextDouble() > 0.3) {
            incomeService.addIncome(new IncomeRequest(baseIncome, "PRIMARY", "Monthly Salary", monthDate,
                    "Primary monthly income"), user);
        }
        
        // Optional bonus (20% chance instead of 50%)
        if (random.nextDouble() > 0.8) {
            double bonus = Math.round(baseIncome * 0.3 * 100.0) / 100.0;
            incomeService.addIncome(new IncomeRequest(bonus, "BONUS", "Monthly Bonus", monthDate,
                    "Optional monthly bonus"), user);
        }
    }

    private final UserRepository userRepository;
    private final IncomeService incomeService;
    private final ExpenseService expenseService;
    private final PasswordEncoder passwordEncoder;
    private final AssetRepository assetRepository;
    private final LiabilityRepository liabilityRepository;
    private final SavingsGoalRepository savingsGoalRepository;

    public DataInitializer(UserRepository userRepository,
                           IncomeService incomeService,
                           ExpenseService expenseService,
                           PasswordEncoder passwordEncoder,
                           AssetRepository assetRepository,
                           LiabilityRepository liabilityRepository,
                           SavingsGoalRepository savingsGoalRepository) {
        this.userRepository = userRepository;
        this.incomeService = incomeService;
        this.expenseService = expenseService;
        this.passwordEncoder = passwordEncoder;
        this.assetRepository = assetRepository;
        this.liabilityRepository = liabilityRepository;
        this.savingsGoalRepository = savingsGoalRepository;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        String[][] workers = {
            {"demo", "demo@finguard.ai", "John Doe", "Freelance Designer & Gig Worker", "1500"},
            {"priya_s", "priya@finguard.ai", "Priya Sharma", "Delivery Driver - Uber/Ola", "10000"},
            {"kabir_v", "kabir@finguard.ai", "Kabir Verma", "YouTuber & Content Creator", "15000"},
            {"rahul_d", "rahul@finguard.ai", "Rahul Das", "Quick Commerce Rider (Zepto/Blinkit)", "5000"},
            {"amit_p", "amit@finguard.ai", "Amit Patel", "Urban Company Plumber & Service Pro", "8000"},
            {"rajesh_k", "rajesh@finguard.ai", "Rajesh Kumar", "Daily Wage Construction Laborer", "6000"},
            {"divya_t", "divya@finguard.ai", "Divya Deva", "Freelance Online Tutor", "12000"}
        };

        LocalDate today = LocalDate.now();

        for (String[] worker : workers) {
            User user = new User();
            user.setUsername(worker[0]);
            user.setEmail(worker[1]);
            user.setPassword(passwordEncoder.encode("password123"));
            user.setFullName(worker[2]);
            user.setRole(Role.USER);
            user.setProfession(worker[3]);
            user.setTargetSavings(Double.parseDouble(worker[4]));
            user.setRoundUpBucketThreshold(50.0);
            user.setAutoRoundUpEnabled(true);

            User savedUser = userRepository.save(user);
            seedUserData(savedUser, today);
            seedNetWorth(savedUser, today, worker[0]);
            seedSavingsGoals(savedUser, today, worker[0]);
        }
    }

    public void seedUserData(User user, LocalDate today) {
        String username = user.getUsername();
        String profession = user.getProfession();

        if ("demo".equals(username)) {
            seedFreelancerData(user, today);
        } else if (profession.contains("Laborer")) {
            seedLaborerData(user, today);
        } else if (profession.contains("Construction")) {
            seedConstructionWorkerData(user, today);
        } else if (profession.contains("Quick Commerce")) {
            seedQuickCommerceData(user, today);
        } else if (profession.contains("Delivery")) {
            seedDeliveryDriverData(user, today);
        } else if (profession.contains("Auto")) {
            seedAutoRickshawData(user, today);
        } else if (profession.contains("Domestic")) {
            seedDomesticHelpData(user, today);
        } else if (profession.contains("Street")) {
            seedStreetVendorData(user, today);
        } else if (profession.contains("Tailor")) {
            seedTailorData(user, today);
        } else if (profession.contains("Maid")) {
            seedMaidData(user, today);
        } else if (profession.contains("Painter")) {
            seedPainterData(user, today);
        } else if (profession.contains("Tutor")) {
            seedTutorData(user, today);
        } else if (profession.contains("Content")) {
            seedContentCreatorData(user, today);
        } else if (profession.contains("Urban Company")) {
            seedUrbanCompanyData(user, today);
        } else {
            // Default seed
            seedFreelancerData(user, today);
        }
    }

    private double jitter(double base, double variancePct) {
        return Math.round((base + (random.nextDouble() * base * variancePct)) * 100.0) / 100.0;
    }

    private void seedFreelancerData(User user, LocalDate today) {
        for (int m = RENT_MONTHS - 1; m >= 0; m--) {
            LocalDate monthDate = today.minusMonths(m).withDayOfMonth(1);

            if (SIMPLE_SEED) {
                double base = jitter(1500.0, 0.15);
                addSimplifiedIncome(user, monthDate, base);
            } else {
                incomeService.addIncome(new IncomeRequest(jitter(1500.0, 0.15), "FREELANCE", "Retainer Client A", monthDate,
                        "Monthly website maintenance retainer"), user);
                incomeService.addIncome(new IncomeRequest(jitter(800.0, 0.2), "BUSINESS", "Invoice - Client B", monthDate.plusDays(5),
                        "Consulting invoice payment"), user);
                if (m % 2 == 0) {
                    incomeService.addIncome(new IncomeRequest(jitter(3200.0, 0.35), "GIG_WORK", "Upwork Gig", monthDate.plusDays(10),
                            "Freelance project payout"), user);
                }
                if (m % 3 == 0) {
                    incomeService.addIncome(new IncomeRequest(jitter(1800.0, 0.25), "GIG_WORK", "Client X", monthDate.plusDays(15),
                            "Design and branding delivery"), user);
                }
                if (m % 4 == 0) {
                    incomeService.addIncome(new IncomeRequest(jitter(900.0, 0.2), "BUSINESS", "Consulting Sprint", monthDate.plusDays(20),
                            "Short-term client engagement"), user);
                }
            }

            expenseService.addExpense(new ExpenseRequest(jitter(185.0, 0.15), "BILLS", monthDate.plusDays(3),
                    "AWS hosting, SaaS and tools"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(1650.0, 0.2), "SHOPPING", monthDate.plusDays(14),
                    "Work equipment and software"), user);
            if (m % 3 == 0) {
                expenseService.addExpense(new ExpenseRequest(jitter(4200.0, 0.25), "SHOPPING", monthDate.plusDays(18),
                        "Home office upgrades"), user);
            }
        }
    }

    private void seedConstructionWorkerData(User user, LocalDate today) {
        for (int m = RENT_MONTHS - 1; m >= 0; m--) {
            LocalDate monthDate = today.minusMonths(m).withDayOfMonth(1);
            boolean isMonsoon = (m >= 2 && m <= 4);
            double monthlyWage = isMonsoon ? 9000.0 : 12000.0;

            
            if (SIMPLE_SEED) {
                double base = jitter(monthlyWage, 0.12);
                addSimplifiedIncome(user, monthDate, base);
            }
            if (!SIMPLE_SEED) {
                incomeService.addIncome(new IncomeRequest(jitter(monthlyWage, 0.12), "WAGE", "Monthly Site Labor", monthDate,
                "Monthly construction wages"), user);

                if (m % 2 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(2500.0, 0.2), "WAGE", "Overtime Incentive", monthDate.plusDays(10),
                "Overtime and weekend labor bonus"), user);
                }
                if (m % 3 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(1800.0, 0.18), "WAGE", "Material Handling", monthDate.plusDays(18),
                "Special material delivery work"), user);
                }

            
            }
            expenseService.addExpense(new ExpenseRequest(jitter(850.0, 0.2), "SHOPPING", monthDate.plusDays(5),
                    "Safety boots and gear"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(650.0, 0.25), "OTHER", monthDate.plusDays(12),
                    "Tool repairs and site maintenance"), user);
            if (m % 2 == 0) {
                expenseService.addExpense(new ExpenseRequest(jitter(1200.0, 0.3), "OTHER", monthDate.plusDays(20),
                        "Seasonal clothing and protective equipment"), user);
            }
        }
    }

    private void seedDeliveryDriverData(User user, LocalDate today) {
        for (int m = RENT_MONTHS - 1; m >= 0; m--) {
            LocalDate monthDate = today.minusMonths(m).withDayOfMonth(1);
            boolean isMonsoon = (m >= 2 && m <= 4);
            double monthlyPayout = isMonsoon ? 18000.0 : 24000.0;

            
            if (SIMPLE_SEED) {
                double base = jitter(monthlyPayout, 0.2);
                addSimplifiedIncome(user, monthDate, base);
            }
            if (!SIMPLE_SEED) {
                incomeService.addIncome(new IncomeRequest(jitter(monthlyPayout, 0.2), "GIG_WORK", "Monthly Delivery Revenue", monthDate,
                "Delivery earnings for the month"), user);
                if (m % 2 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(1200.0, 0.25), "GIG_WORK", "Performance Bonus", monthDate.plusDays(10),
                "High-target incentive"), user);
                }
                if (m % 3 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(900.0, 0.25), "GIG_WORK", "Weekend Surge", monthDate.plusDays(18),
                "Weekend delivery surge bonuses"), user);
                }

            
            }
            expenseService.addExpense(new ExpenseRequest(jitter(1200.0, 0.2), "TRAVEL", monthDate.plusDays(4),
                    "Fuel refill and vehicle maintenance"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(700.0, 0.25), "BILLS", monthDate.plusDays(11),
                    "Phone and delivery app subscriptions"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(1100.0, 0.3), "OTHER", monthDate.plusDays(17),
                    "Bike servicing and spare parts"), user);
        }
    }

    private void seedAutoRickshawData(User user, LocalDate today) {
        for (int m = RENT_MONTHS - 1; m >= 0; m--) {
            LocalDate monthDate = today.minusMonths(m).withDayOfMonth(1);
            boolean isMonsoon = (m >= 2 && m <= 4);
            double monthlyRevenue = isMonsoon ? 16500.0 : 20500.0;

            
            if (SIMPLE_SEED) {
                double base = jitter(monthlyRevenue, 0.18);
                addSimplifiedIncome(user, monthDate, base);
            }
            if (!SIMPLE_SEED) {
                incomeService.addIncome(new IncomeRequest(jitter(monthlyRevenue, 0.18), "BUSINESS", "Rickshaw Revenue", monthDate,
                "Monthly auto-rickshaw earnings"), user);
                if (m % 2 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(1400.0, 0.2), "BUSINESS", "Airport Runs", monthDate.plusDays(8),
                "Airport and premium rides"), user);
                }
                if (m % 3 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(1900.0, 0.22), "BUSINESS", "Contract Ride", monthDate.plusDays(16),
                "Special contract bookings"), user);
                }

            
            }
            expenseService.addExpense(new ExpenseRequest(jitter(900.0, 0.2), "TRAVEL", monthDate.plusDays(5),
                    "CNG refill and servicing"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(600.0, 0.25), "OTHER", monthDate.plusDays(11),
                    "Vehicle repairs and spare parts"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(1300.0, 0.25), "OTHER", monthDate.plusDays(17),
                    "Major maintenance or part replacement"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(700.0, 0.2), "BILLS", monthDate.plusDays(10),
                    "Phone and app subscriptions"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(850.0, 0.25), "SHOPPING", monthDate.plusDays(14),
                    "Cleaning and safety supplies"), user);
        }
    }

    private void seedDomesticHelpData(User user, LocalDate today) {
        for (int m = RENT_MONTHS - 1; m >= 0; m--) {
            LocalDate monthDate = today.minusMonths(m).withDayOfMonth(1);

            
            if (SIMPLE_SEED) {
                double base = jitter(8200.0, 0.1);
                addSimplifiedIncome(user, monthDate, base);
            }
            if (!SIMPLE_SEED) {
                incomeService.addIncome(new IncomeRequest(jitter(8200.0, 0.1), "WAGE", "Domestic Salaries", monthDate,
                "Monthly household wages"), user);
                if (m % 2 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(1200.0, 0.18), "WAGE", "Deep Cleaning Bonus", monthDate.plusDays(12),
                "Extra cleaning & prep"), user);
                }
                if (m % 3 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(1500.0, 0.15), "WAGE", "Festival Work", monthDate.plusDays(18),
                "Festival and event service"), user);
                }

            
            }
            expenseService.addExpense(new ExpenseRequest(jitter(700.0, 0.2), "SHOPPING", monthDate.plusDays(6),
                    "Cleaning supplies and uniforms"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(500.0, 0.2), "BILLS", monthDate.plusDays(11),
                    "Household utilities"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(1200.0, 0.25), "OTHER", monthDate.plusDays(20),
                    "Major equipment or supply replenishment"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(450.0, 0.2), "OTHER", monthDate.plusDays(14),
                    "Transport and meal costs"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(950.0, 0.25), "SHOPPING", monthDate.plusDays(16),
                    "Household restocking"), user);
        }
    }

    private void seedStreetVendorData(User user, LocalDate today) {
        for (int m = RENT_MONTHS - 1; m >= 0; m--) {
            LocalDate monthDate = today.minusMonths(m).withDayOfMonth(1);
            boolean isMonsoon = (m >= 2 && m <= 4);
            double monthlySales = isMonsoon ? 9800.0 : 13600.0;

            
            if (SIMPLE_SEED) {
                double base = jitter(monthlySales, 0.18);
                addSimplifiedIncome(user, monthDate, base);
            }
            if (!SIMPLE_SEED) {
                incomeService.addIncome(new IncomeRequest(jitter(monthlySales, 0.18), "BUSINESS", "Stall Sales", monthDate,
                "Monthly vendor stall revenue"), user);
                if (m % 2 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(4200.0, 0.2), "BUSINESS", "Market Fair", monthDate.plusDays(10),
                "Weekend market fair revenue"), user);
                }
                if (m % 3 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(3200.0, 0.22), "BUSINESS", "Pop-Up Event", monthDate.plusDays(18),
                "Special event sales"), user);
                }

            
            }
            expenseService.addExpense(new ExpenseRequest(jitter(1400.0, 0.2), "SHOPPING", monthDate.plusDays(4),
                    "Inventory and raw materials"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(920.0, 0.2), "OTHER", monthDate.plusDays(11),
                    "Stall maintenance and utilities"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(1700.0, 0.25), "OTHER", monthDate.plusDays(19),
                    "Major restocking and repairs"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(900.0, 0.2), "BILLS", monthDate.plusDays(14),
                    "License and service charges"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(600.0, 0.2), "SHOPPING", monthDate.plusDays(16),
                    "Packaging and supplies"), user);
        }
    }

    private void seedTailorData(User user, LocalDate today) {
        for (int m = RENT_MONTHS - 1; m >= 0; m--) {
            LocalDate monthDate = today.minusMonths(m).withDayOfMonth(1);
            double monthlyOrders = 11200.0;

            
            if (SIMPLE_SEED) {
                double base = jitter(monthlyOrders, 0.2);
                addSimplifiedIncome(user, monthDate, base);
            }
            if (!SIMPLE_SEED) {
                incomeService.addIncome(new IncomeRequest(jitter(monthlyOrders, 0.2), "BUSINESS", "Tailor Revenue", monthDate,
                "Monthly tailoring orders"), user);
                if (m % 2 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(6400.0, 0.22), "BUSINESS", "Bulk Order", monthDate.plusDays(10),
                "Bulk stitching order"), user);
                }
                if (m % 3 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(2700.0, 0.2), "BUSINESS", "Rush Alterations", monthDate.plusDays(18),
                "Rush tailoring service"), user);
                }

            
            }
            expenseService.addExpense(new ExpenseRequest(jitter(900.0, 0.2), "SHOPPING", monthDate.plusDays(6),
                    "Fabric, thread and supplies"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(1300.0, 0.25), "OTHER", monthDate.plusDays(12),
                    "Major material restocking"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(600.0, 0.2), "OTHER", monthDate.plusDays(18),
                    "Equipment maintenance"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(450.0, 0.2), "BILLS", monthDate.plusDays(14),
                    "Utility and tool subscriptions"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(300.0, 0.15), "OTHER", monthDate.plusDays(16),
                    "Packaging and delivery supplies"), user);
        }
    }

    private void seedLaborerData(User user, LocalDate today) {
        for (int m = RENT_MONTHS - 1; m >= 0; m--) {
            LocalDate monthDate = today.minusMonths(m).withDayOfMonth(1);
            boolean isMonsoon = (m >= 2 && m <= 4);
            double monthlyWage = isMonsoon ? 8500.0 : 10600.0;

            
            if (SIMPLE_SEED) {
                double base = jitter(monthlyWage, 0.12);
                addSimplifiedIncome(user, monthDate, base);
            }
            if (!SIMPLE_SEED) {
                incomeService.addIncome(new IncomeRequest(jitter(monthlyWage, 0.12), "WAGE", "Laborer Wage", monthDate,
                "Monthly labor wages"), user);
                if (m % 2 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(1800.0, 0.15), "WAGE", "Extra Work", monthDate.plusDays(10),
                "Additional labor job"), user);
                }
                if (m % 3 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(1400.0, 0.18), "WAGE", "Site Bonus", monthDate.plusDays(18),
                "Performance and attendance bonus"), user);
                }

            
            }
            expenseService.addExpense(new ExpenseRequest(jitter(950.0, 0.2), "FOOD", monthDate.plusDays(4),
                    "Monthly food expenses"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(400.0, 0.2), "SHOPPING", monthDate.plusDays(12),
                    "Work clothes and basic tools"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(900.0, 0.25), "OTHER", monthDate.plusDays(20),
                    "Major repair or medical expense"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(300.0, 0.15), "BILLS", monthDate.plusDays(14),
                    "Phone and small utilities"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(650.0, 0.2), "OTHER", monthDate.plusDays(16),
                    "Transportation and minor supplies"), user);
        }
    }

    private void seedMaidData(User user, LocalDate today) {
        for (int m = RENT_MONTHS - 1; m >= 0; m--) {
            LocalDate monthDate = today.minusMonths(m).withDayOfMonth(1);

            
            if (SIMPLE_SEED) {
                double base = jitter(7500.0, 0.1);
                addSimplifiedIncome(user, monthDate, base);
            }
            if (!SIMPLE_SEED) {
                incomeService.addIncome(new IncomeRequest(jitter(7500.0, 0.1), "WAGE", "Maid Salaries", monthDate,
                "Monthly household wages"), user);
                if (m % 2 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(900.0, 0.15), "WAGE", "Cooking Service", monthDate.plusDays(8),
                "Extra cooking & party catering"), user);
                }
                if (m % 3 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(5200.0, 0.12), "WAGE", "Festival Bonus", monthDate.plusDays(18),
                "Festival bonus from employers"), user);
                }

            
            }
            expenseService.addExpense(new ExpenseRequest(jitter(700.0, 0.2), "SHOPPING", monthDate.plusDays(5),
                    "Cleaning supplies and uniforms"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(500.0, 0.2), "BILLS", monthDate.plusDays(11),
                    "Utilities and transport"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(1300.0, 0.25), "OTHER", monthDate.plusDays(16),
                    "Major household supplies"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(950.0, 0.2), "OTHER", monthDate.plusDays(13),
                    "Childcare and commute costs"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(600.0, 0.2), "SHOPPING", monthDate.plusDays(18),
                    "Uniform and equipment restocking"), user);
        }
    }

    private void seedPainterData(User user, LocalDate today) {
        for (int m = RENT_MONTHS - 1; m >= 0; m--) {
            LocalDate monthDate = today.minusMonths(m).withDayOfMonth(1);
            boolean isPeak = (m >= 3 && m <= 5);

            
            if (SIMPLE_SEED) {
                double base = jitter(isPeak ? 11800.0 : 8100.0, 0.18);
                addSimplifiedIncome(user, monthDate, base);
            }
            if (!SIMPLE_SEED) {
                incomeService.addIncome(new IncomeRequest(jitter(isPeak ? 11800.0 : 8100.0, 0.18), "FREELANCE", "Painting Projects", monthDate,
                "Monthly painting and renovation contracts"), user);
                if (m % 2 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(5400.0, 0.22), "FREELANCE", "Repair Work", monthDate.plusDays(8),
                "Minor touch-up and waterproofing jobs"), user);
                }
                if (m % 3 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(7200.0, 0.2), "FREELANCE", "Premium Contract", monthDate.plusDays(16),
                "Larger painting contract"), user);
                }

            
            }
            expenseService.addExpense(new ExpenseRequest(jitter(2500.0, 0.25), "SHOPPING", monthDate.plusDays(6),
                    "Paint and materials"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(1600.0, 0.22), "OTHER", monthDate.plusDays(12),
                    "Tools and safety gear"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(2800.0, 0.25), "OTHER", monthDate.plusDays(18),
                    "Contract labor and scaffolding"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(950.0, 0.2), "BILLS", monthDate.plusDays(14),
                    "Utility and transport"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(720.0, 0.2), "OTHER", monthDate.plusDays(16),
                    "Safety and storage supplies"), user);
        }
    }

    private void seedTutorData(User user, LocalDate today) {
        for (int m = RENT_MONTHS - 1; m >= 0; m--) {
            LocalDate monthDate = today.minusMonths(m).withDayOfMonth(1);
            boolean isExamSeason = (m <= 2);
            boolean isSummer = (m >= 4 && m <= 5);

            
            if (SIMPLE_SEED) {
                double base = jitter(isExamSeason ? 14200.0 : (isSummer ? 9600.0 : 11800.0), 0.18);
                addSimplifiedIncome(user, monthDate, base);
            }
            if (!SIMPLE_SEED) {
                incomeService.addIncome(new IncomeRequest(jitter(isExamSeason ? 14200.0 : (isSummer ? 9600.0 : 11800.0), 0.18), "FREELANCE", "Tuition Revenue", monthDate,
                "Monthly tuition fees from students"), user);
                if (m % 2 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(1650.0, 0.25), "FREELANCE", "Crash Course", monthDate.plusDays(10),
                "Short-term exam batch"), user);
                }
                if (m % 3 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(2400.0, 0.2), "FREELANCE", "Weekend Workshops", monthDate.plusDays(17),
                "Specialized weekend tuition"), user);
                }

            
            }
            expenseService.addExpense(new ExpenseRequest(jitter(350.0, 0.2), "SHOPPING", monthDate.plusDays(6),
                    "Study materials and reference books"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(780.0, 0.18), "BILLS", monthDate.plusDays(12),
                    "Internet and classroom rental"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(420.0, 0.2), "OTHER", monthDate.plusDays(18),
                    "Teaching supplies and refreshments"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(550.0, 0.2), "OTHER", monthDate.plusDays(14),
                    "Tuitor travel and communication"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(720.0, 0.2), "SHOPPING", monthDate.plusDays(16),
                    "Stationery and printer supplies"), user);
        }
    }

    private void seedContentCreatorData(User user, LocalDate today) {
        for (int m = RENT_MONTHS - 1; m >= 0; m--) {
            LocalDate monthDate = today.minusMonths(m).withDayOfMonth(1);

            
            if (SIMPLE_SEED) {
                double base = jitter(11800.0, 0.28);
                addSimplifiedIncome(user, monthDate, base);
            }
            if (!SIMPLE_SEED) {
                incomeService.addIncome(new IncomeRequest(jitter(11800.0, 0.28), "FREELANCE", "Creator Revenue", monthDate,
                "Monthly content creation income"), user);
                if (m % 2 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(12800.0, 0.32), "FREELANCE", "Sponsorship Deal", monthDate.plusDays(10),
                "Brand sponsorship payout"), user);
                }
                if (m % 3 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(6200.0, 0.28), "GIG_WORK", "Affiliate Commission", monthDate.plusDays(18),
                "Affiliate and referral payments"), user);
                }

            
            }
            expenseService.addExpense(new ExpenseRequest(jitter(1500.0, 0.15), "BILLS", monthDate.plusDays(6),
                    "Software and hosting subscriptions"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(4500.0, 0.15), "SHOPPING", monthDate.plusDays(12),
                    "Camera gear and editing accessories"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(3200.0, 0.22), "OTHER", monthDate.plusDays(16),
                    "Studio and travel expenses"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(900.0, 0.18), "OTHER", monthDate.plusDays(14),
                    "Marketing and promotion"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(800.0, 0.2), "BILLS", monthDate.plusDays(18),
                    "Utility and data costs"), user);
        }
    }

    private void seedQuickCommerceData(User user, LocalDate today) {
        for (int m = RENT_MONTHS - 1; m >= 0; m--) {
            LocalDate monthDate = today.minusMonths(m).withDayOfMonth(1);
            boolean isMonsoon = (m >= 2 && m <= 4);
            double basePayout = isMonsoon ? 16300.0 : 20400.0;

            
            if (SIMPLE_SEED) {
                double base = jitter(basePayout, 0.22);
                addSimplifiedIncome(user, monthDate, base);
            }
            if (!SIMPLE_SEED) {
                incomeService.addIncome(new IncomeRequest(jitter(basePayout, 0.22), "GIG_WORK", "Quick Commerce Revenue", monthDate,
                "Monthly q-commerce delivery payout"), user);
                if (m % 2 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(3800.0, 0.2), "GIG_WORK", "Peak Bonus", monthDate.plusDays(12),
                "Peak hour bonus earnings"), user);
                }
                if (m % 3 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(2400.0, 0.18), "GIG_WORK", "Incentive Bonus", monthDate.plusDays(20),
                "Target incentive payout"), user);
                }

            
            }
            expenseService.addExpense(new ExpenseRequest(jitter(1200.0, 0.1), "TRAVEL", monthDate.plusDays(4),
                    "Motorcycle servicing and oil change"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(1700.0, 0.2), "SHOPPING", monthDate.plusDays(10),
                    "Delivery gear and phone accessories"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(900.0, 0.2), "OTHER", monthDate.plusDays(14),
                    "Fuel and small repairs"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(600.0, 0.2), "BILLS", monthDate.plusDays(16),
                    "Data and app commission fees"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(500.0, 0.2), "OTHER", monthDate.plusDays(18),
                    "Protective equipment and hygiene supplies"), user);
        }
    }

    private void seedUrbanCompanyData(User user, LocalDate today) {
        for (int m = RENT_MONTHS - 1; m >= 0; m--) {
            LocalDate monthDate = today.minusMonths(m).withDayOfMonth(1);
            boolean isPeakSeason = (m <= 2);

            
            if (SIMPLE_SEED) {
                double base = jitter(isPeakSeason ? 16700.0 : 11800.0, 0.18);
                addSimplifiedIncome(user, monthDate, base);
            }
            if (!SIMPLE_SEED) {
                incomeService.addIncome(new IncomeRequest(jitter(isPeakSeason ? 16700.0 : 11800.0, 0.18), "BUSINESS", "Service Revenue", monthDate,
                "Monthly UrbanCompany service income"), user);
                if (m % 2 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(8400.0, 0.2), "BUSINESS", "Premium Booking", monthDate.plusDays(12),
                "Premium service booking payout"), user);
                }
                if (m % 4 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(4200.0, 0.2), "BUSINESS", "Emergency Call-out", monthDate.plusDays(22),
                "Emergency plumbing and repair jobs"), user);
                }

            
            }
            expenseService.addExpense(new ExpenseRequest(jitter(1500.0, 0.15), "SHOPPING", monthDate.plusDays(6),
                    "Plumbing supplies and tool refills"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(950.0, 0.18), "TRAVEL", monthDate.plusDays(10),
                    "Travel and logistics"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(1700.0, 0.22), "OTHER", monthDate.plusDays(14),
                    "Equipment maintenance"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(600.0, 0.18), "BILLS", monthDate.plusDays(18),
                    "Communication and platform fees"), user);
            expenseService.addExpense(new ExpenseRequest(jitter(1200.0, 0.25), "OTHER", monthDate.plusDays(20),
                    "Protective gear and safety supplies"), user);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SEED NET WORTH — Assets & Liabilities per user
    // ─────────────────────────────────────────────────────────────────────────
    public void seedNetWorth(User user, LocalDate today, String username) {
        if ("demo".equals(username)) {
            seedAsset(user, "SBI Savings Account", "SAVINGS", 45000.0, today.minusDays(180));
            seedAsset(user, "Laptop (MacBook Pro)", "VEHICLE", 85000.0, today.minusDays(400));
            seedAsset(user, "Mutual Fund – Axis Bluechip", "INVESTMENT", 30000.0, today.minusDays(90));
            seedAsset(user, "Cash in Hand", "CASH", 5500.0, today.minusDays(1));

            seedLiability(user, "HDFC Personal Loan", "PERSONAL_LOAN", 50000.0, 12.5, today.minusDays(300));
            seedLiability(user, "SBI Credit Card Dues", "CREDIT_CARD", 8000.0, 36.0, today.minusDays(20));

        } else if ("rajesh_k".equals(username)) {
            seedAsset(user, "Bank of Baroda Account", "SAVINGS", 12000.0, today.minusDays(200));
            seedAsset(user, "Gold Jewellery (50g)", "OTHER", 28000.0, today.minusDays(500));
            seedAsset(user, "Second-hand Bike (Hero Splendor)", "VEHICLE", 22000.0, today.minusDays(600));

            seedLiability(user, "Microfinance Group Loan", "PERSONAL_LOAN", 15000.0, 18.0, today.minusDays(120));
            seedLiability(user, "Tools Purchase EMI", "PERSONAL_LOAN", 6000.0, 14.0, today.minusDays(60));

        } else if ("priya_s".equals(username)) {
            seedAsset(user, "Canara Bank Savings", "SAVINGS", 22000.0, today.minusDays(150));
            seedAsset(user, "Scooter (Activa 6G)", "VEHICLE", 65000.0, today.minusDays(365));
            seedAsset(user, "LIC Policy (Maturity Value)", "INVESTMENT", 50000.0, today.minusDays(730));
            seedAsset(user, "PPF Account", "SAVINGS", 18000.0, today.minusDays(240));

            seedLiability(user, "Bajaj Finserv Loan (Scooter)", "PERSONAL_LOAN", 30000.0, 10.5, today.minusDays(350));
            seedLiability(user, "Amazon Pay Later", "CREDIT_CARD", 3200.0, 24.0, today.minusDays(15));
        } else if ("kabir_v".equals(username)) {
            seedAsset(user, "HDFC Savings Account", "SAVINGS", 35000.0, today.minusDays(100));
            seedAsset(user, "Camera Gear", "OTHER", 120000.0, today.minusDays(300));
            seedLiability(user, "Equipment EMI", "PERSONAL_LOAN", 40000.0, 14.0, today.minusDays(150));
        } else if ("rahul_d".equals(username)) {
            seedAsset(user, "Paytm Payments Bank", "SAVINGS", 8000.0, today.minusDays(200));
            seedAsset(user, "Electric Bike", "VEHICLE", 70000.0, today.minusDays(100));
            seedLiability(user, "EV Loan", "PERSONAL_LOAN", 50000.0, 11.0, today.minusDays(90));
        } else if ("amit_p".equals(username)) {
            seedAsset(user, "SBI Savings Account", "SAVINGS", 15000.0, today.minusDays(300));
            seedAsset(user, "Plumbing Tools", "OTHER", 25000.0, today.minusDays(400));
            seedLiability(user, "Personal Loan", "PERSONAL_LOAN", 20000.0, 15.0, today.minusDays(200));
        } else if ("divya_t".equals(username)) {
            seedAsset(user, "ICICI Savings Account", "SAVINGS", 40000.0, today.minusDays(250));
            seedAsset(user, "Fixed Deposit", "INVESTMENT", 50000.0, today.minusDays(500));
            seedLiability(user, "Education Loan", "PERSONAL_LOAN", 100000.0, 9.5, today.minusDays(800));
        } else {
            // Default generic seed for any other user
            seedAsset(user, "Primary Bank Savings", "SAVINGS", 10000.0, today.minusDays(100));
            seedLiability(user, "Credit Card Dues", "CREDIT_CARD", 2000.0, 24.0, today.minusDays(15));
        }
    }

    private void seedAsset(User user, String name, String type, Double value, LocalDate date) {
        Asset asset = new Asset();
        asset.setUser(user);
        asset.setName(name);
        asset.setType(type);
        asset.setValue(value);
        asset.setDate(date);
        assetRepository.save(asset);
    }

    private void seedLiability(User user, String name, String type, Double value, Double interestRate, LocalDate date) {
        Liability liability = new Liability();
        liability.setUser(user);
        liability.setName(name);
        liability.setType(type);
        liability.setValue(value);
        liability.setInterestRate(interestRate);
        liability.setDate(date);
        liabilityRepository.save(liability);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SEED SAVINGS GOALS — for each user
    // ─────────────────────────────────────────────────────────────────────────
    public void seedSavingsGoals(User user, LocalDate today, String username) {
        if ("demo".equals(username)) {
            seedGoal(user, "Emergency Fund 🚨", 50000.0, 12500.0, today.plusMonths(9), "ACTIVE");
            seedGoal(user, "New Camera 📷", 25000.0, 9000.0, today.plusMonths(6), "ACTIVE");
            seedGoal(user, "Goa Trip 🏖️", 15000.0, 15000.0, today.minusMonths(1), "COMPLETED");

        } else if ("rajesh_k".equals(username)) {
            seedGoal(user, "Children's School Fees 📚", 20000.0, 6500.0, today.plusMonths(8), "ACTIVE");
            seedGoal(user, "Festival Savings (Diwali) 🪔", 12000.0, 4000.0, today.plusMonths(3), "ACTIVE");
            seedGoal(user, "Medical Emergency Fund 🏥", 25000.0, 3500.0, today.plusMonths(15), "ACTIVE");

        } else if ("priya_s".equals(username)) {
            seedGoal(user, "New Laptop for Teaching 💻", 45000.0, 12000.0, today.plusMonths(6), "ACTIVE");
            seedGoal(user, "Online Course Certification 🎓", 8000.0, 8000.0, today.minusDays(5), "COMPLETED");
            seedGoal(user, "Home Renovation 🏠", 80000.0, 15000.0, today.plusMonths(20), "ACTIVE");
        } else if ("kabir_v".equals(username)) {
            seedGoal(user, "New Studio Lighting 💡", 15000.0, 5000.0, today.plusMonths(3), "ACTIVE");
            seedGoal(user, "New Editing PC 🖥️", 80000.0, 20000.0, today.plusMonths(12), "ACTIVE");
        } else if ("rahul_d".equals(username)) {
            seedGoal(user, "Helmet & Safety Gear 🪖", 3000.0, 1000.0, today.plusMonths(1), "ACTIVE");
            seedGoal(user, "Bike Loan Prepayment 🏍️", 20000.0, 5000.0, today.plusMonths(5), "ACTIVE");
        } else if ("amit_p".equals(username)) {
            seedGoal(user, "New Power Drill 🔧", 8000.0, 4000.0, today.plusMonths(2), "ACTIVE");
            seedGoal(user, "Van Downpayment 🚐", 100000.0, 10000.0, today.plusMonths(24), "ACTIVE");
        } else if ("divya_t".equals(username)) {
            seedGoal(user, "Webcam Upgrade 📷", 5000.0, 2000.0, today.plusMonths(1), "ACTIVE");
            seedGoal(user, "Vacation 🏖️", 30000.0, 15000.0, today.plusMonths(6), "ACTIVE");
        }

        // Fallback auto round-up goal so round-up deposits are preserved if no other target is available.
        seedGoal(user, "Auto Round-Up Savings", 100.0, 0.0, today.plusYears(2), "ACTIVE");
    }

    private void seedGoal(User user, String name, Double target, Double current, LocalDate targetDate, String status) {
        SavingsGoal goal = new SavingsGoal();
        goal.setUser(user);
        goal.setName(name);
        goal.setTargetAmount(target);
        goal.setCurrentAmount(current);
        goal.setTargetDate(targetDate);
        goal.setStatus(status);
        savingsGoalRepository.save(goal);
    }
}
