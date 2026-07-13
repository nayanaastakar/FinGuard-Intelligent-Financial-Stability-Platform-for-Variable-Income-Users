import re

file_path = r"C:\Users\poorn\Downloads\api\FinGuardAPI-main\backend\src\main\java\com\finguard\api\config\DataInitializer.java"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

def process_method(method_name, base_var_or_val):
    global content
    
    # Regex to capture the method block from start to the end of the `for` loop
    # We find the start of the method, the start of the `for` loop, the incomes, and the expenses.
    
    pattern = r"(private void " + method_name + r"\(User user, LocalDate today\) \{[\s\S]*?for \(int m = RENT_MONTHS - 1; m >= 0; m--\) \{[\s\S]*?LocalDate monthDate = today\.minusMonths\(m\)\.withDayOfMonth\(1\);[\s\S]*?)(incomeService\.addIncome\([\s\S]*?)(expenseService\.addExpense\()"
    
    match = re.search(pattern, content)
    if not match:
        print(f"Could not find match for {method_name}")
        return
        
    prefix = match.group(1)
    incomes_block = match.group(2)
    expenses_start = match.group(3)
    
    # Check if we have boolean variables declared right after LocalDate
    # e.g., boolean isMonsoon = ...;
    # double monthlyWage = ...;
    # We want to keep those in the prefix, which the regex does, but we need to ensure the incomes_block only starts at the first incomeService.addIncome
    
    # To be safe, we extract the incomes block and wrap it in `if (!SIMPLE_SEED) { ... }`
    # and prepend the `if (SIMPLE_SEED) { addSimplifiedIncome(...) }`
    
    # Fix indentation for the incomes block
    indented_incomes = []
    for line in incomes_block.splitlines():
        if line.strip():
            indented_incomes.append("                " + line.strip())
        else:
            indented_incomes.append(line)
    
    wrapped_incomes = "            if (!SIMPLE_SEED) {\n" + "\n".join(indented_incomes) + "\n            }\n"
    
    simplified_block = f"""
            if (SIMPLE_SEED) {{
                double base = {base_var_or_val};
                addSimplifiedIncome(user, monthDate, base);
            }}
"""
    
    new_method_content = prefix + simplified_block + wrapped_incomes + "            " + expenses_start
    content = content[:match.start()] + new_method_content + content[match.end():]

# In seedFreelancerData, it already has some SIMPLE_SEED logic, we need to revert it or handle it cleanly.
# Actually, since seedFreelancerData was messed up, let's fix it manually in python by full string replacement.

freelancer_full = """    private void seedFreelancerData(User user, LocalDate today) {
        generateMonthlyCashFlows(user, today, 3000.0, 150.0, 50.0);

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
    }"""

content = re.sub(r"private void seedFreelancerData\(User user, LocalDate today\) \{[\s\S]*?\}\n    \}", freelancer_full, content)


process_method("seedConstructionWorkerData", "jitter(monthlyWage, 0.12)")
process_method("seedDeliveryDriverData", "jitter(monthlyPayout, 0.2)")
process_method("seedAutoRickshawData", "jitter(monthlyRevenue, 0.18)")
process_method("seedDomesticHelpData", "jitter(8200.0, 0.1)")
process_method("seedStreetVendorData", "jitter(monthlySales, 0.18)")
process_method("seedTailorData", "jitter(monthlyOrders, 0.2)")
process_method("seedLaborerData", "jitter(monthlyWage, 0.12)")
process_method("seedMaidData", "jitter(7500.0, 0.1)")
process_method("seedPainterData", "jitter(isPeak ? 11800.0 : 8100.0, 0.18)")
process_method("seedTutorData", "jitter(isExamSeason ? 14200.0 : (isSummer ? 9600.0 : 11800.0), 0.18)")
process_method("seedContentCreatorData", "jitter(11800.0, 0.28)")
process_method("seedQuickCommerceData", "jitter(basePayout, 0.22)")
process_method("seedUrbanCompanyData", "jitter(isPeakSeason ? 16700.0 : 11800.0, 0.18)")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Done refactoring.")
