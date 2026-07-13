# FinGuard API - Project Document & Exam Guide

## 1. Problem Statement
Many gig-economy workers, freelancers, and daily wage earners experience highly volatile and unpredictable income streams. Traditional financial tools are designed for salaried individuals with predictable monthly incomes, leaving gig workers without proper insights into their financial stability. They struggle with cash flow management, lack emergency reserves, and are vulnerable to sudden financial shocks or fraudulent transactions.

## 2. Objectives
- To develop a financial management platform tailored for individuals with variable incomes.
- To calculate a dynamic Financial Stability Index (FSI) based on income volatility and fixed expenses.
- To provide an automated Cushion Vault (Stability Sweep) for building emergency reserves.
- To provide a configurable auto round-up bucket threshold with fallback reserve behavior when no active savings goals exist.
- To detect real-time transaction anomalies (spikes or duplicate charges) and alert the user.
- To offer an AI-driven advisor that provides personalized savings projections and budget allocations.

## 3. Tools & Technologies Required
- **Frontend:** React 18, Vite, Recharts, Lucide React, Vanilla CSS.
- **Backend:** Java 17, Spring Boot 3.2.x, Spring Security (JWT), Spring Data JPA.
- **Database:** H2 Database (In-Memory for development), PostgreSQL (Production).
- **Other Tools:** Docker, Maven, Git, Node.js, npm.

## 4. Architecture
The application follows a standard three-tier architecture:
- **Presentation Layer (Client):** A React-based Single Page Application (SPA) that provides the user interface, interactive dashboards, and communicates with the backend via RESTful APIs.
- **Application Layer (Server):** A Spring Boot backend that handles business logic, security (JWT authentication), FSI calculations, and anomaly detection.
- **Data Layer:** An H2/PostgreSQL database accessed via Spring Data JPA for persisting user data, incomes, expenses, assets, liabilities, and goals.

*(A high-level methodology workflow)*
1. User authenticates via JWT.
2. User inputs or links bank accounts (simulated Account Aggregator).
3. System records incomes and expenses.
4. Stability Service runs calculations on the historical data.
5. Fraud Detection Service intercepts new expenses to check against historical averages.

## 5. Methodology & Working Logic
### 5.1 Financial Stability Index (FSI) Calculation
**Algorithm & Formula:**
The FSI evaluates income volatility and monthly burn rate.
- **Income Volatility:** Calculated using the Coefficient of Variation (CV) of the last 6 months' income. 
  `CV = Standard Deviation of Income / Mean Income`
- **Monthly Burn Rate:** The ratio of fixed expenses (Bills, Rent) to total income.
- **FSI Score:** A proprietary weighted formula combining CV and Burn Rate. A higher CV (high volatility) or higher Burn Rate lowers the score. The score is normalized to a 0-100 scale.
  *(Example calculation: If mean income is 20k, and std dev is 5k, CV = 0.25. If fixed expenses are 10k, burn rate = 50%. The system maps this matrix to a corresponding safety score.)*

### 5.2 Auto-Sweep (Cushion Vault) Logic
- **Trigger:** When a new income is recorded and `isAutoSweepActive` is true.
- **Formula:** `Sweep Amount = Incoming Amount * 0.15` (15% is transferred).
- **Action:** The calculated amount is added to the `stabilityVaultBalance` to build a reserve automatically.
- **Round-Up Threshold:** The system honors the user's configured round-up bucket threshold and releases funds to savings goals only when there is at least one active goal; otherwise the bucket remains as a reserve.

### 5.3 Anomaly & Fraud Detection
- **Trigger:** When a new expense is logged.
- **Logic:**
  1. **Outlier Spike:** Queries historical average for the expense category. If `New Expense Amount > (Category Average * 2.5)`, it is flagged as an anomaly.
  2. **Velocity Spike:** Checks if an identical amount for the same category was charged on the same day. If true, flags as a potential double-billing.

## 5.4 Detailed Function-Wise Working Logic
This section explains the working logic of each major feature in the project, along with the formulas and algorithms used.

### 5.4.1 Authentication and Security Module
- Function: Registers new users, authenticates existing users, and protects backend APIs.
- Working Logic: The authentication flow starts in the auth controller, where the user submits login or registration data. The system validates credentials, encodes the password, and generates a JWT token if the request is valid. On every subsequent API call, the JWT filter intercepts the request, validates the token, and allows or blocks access based on the token validity and user role.
- Algorithm: If credentials are valid -> create token; if invalid -> return authentication error.
- Formula/Rule: Access is granted only when the token is signed correctly and has not expired.

### 5.4.2 Dashboard Module
- Function: Provides the main overview page with financial summaries, alerts, and scorecards.
- Working Logic: The dashboard service collects the latest income, expense, stability score, fraud alerts, and balance details from the database. It then prepares a unified summary that can be displayed on the frontend.
- Algorithm: Aggregate each user's transactions, calculate net balance, and merge with alert and stability data.
- Formula: Net Balance = Total Income - Total Expense.

### 5.4.3 Income Management Module
- Function: Records incoming money from salaries, freelance jobs, gig work, or bonuses.
- Working Logic: When a user adds income, the system validates the amount, stores it in the database, and triggers the stability recalculation service. This ensures the financial score updates immediately after each income event.
- Algorithm:
  1. Accept income entry.
  2. Save income in the database.
  3. Recalculate the stability index for that user.
  4. Update the dashboard and UI state.
- Formula: Monthly Income = Sum of all income entries recorded in that month.

### 5.4.4 Expense Management Module
- Function: Records daily spending and updates the user's financial health score.
- Working Logic: Upon adding an expense, the system saves the transaction, checks whether it resembles suspicious behaviour, and recalculates the user's stability score. This links spending behaviour directly to risk detection and budgeting.
- Algorithm:
  1. Receive expense request.
  2. Save expense in the database.
  3. Run anomaly detection logic.
  4. Recalculate FSI and refresh dashboard.
- Formula: Monthly Expense = Sum of all expense entries recorded in that month.

### 5.4.5 Financial Stability Index (FSI) Module
- Function: Measures how financially stable the user is based on income variability, spending, debt, and savings behaviour.
- Working Logic: The system collects the last 9 months of historical income and expense data, calculates monthly averages, measures income volatility, evaluates burn rate, and combines this with debt and savings behaviour to produce a score between 0 and 100.
- Formula:
  - Average Monthly Income = Total Income / Number of Months
  - Average Monthly Expense = Total Expense / Number of Months
  - Volatility (Coefficient of Variation) = Standard Deviation of Income / Mean Income
  - Burn Rate = Average Expense / Average Income
  - Savings Goal Gap = 1 - (Savings Potential / Target Savings), clipped between 0 and 1
  - Raw FSI Score = 100 Ã— (1 - 0.38 Ã— Burn Rate - 0.27 Ã— Volatility - 0.22 Ã— Debt Ratio - 0.10 Ã— Savings Goal Gap)
  - Final Score = Clamp(Raw Score, 5 to 98)
  - If net balance is negative, the score is capped severely to avoid showing unrealistic stability.
- Logic: Lower score means higher risk; higher score means stronger financial stability.

### 5.4.6 Auto-Sweep / Cushion Vault Module
- Function: Automatically moves a portion of incoming income into a savings reserve.
- Working Logic: When income is logged and auto-sweep is enabled, the system creates a small reserve transfer. This helps the user build emergency savings passively.
- Algorithm:
  1. Detect new income event.
  2. Check if auto-sweep toggle is active.
  3. Calculate sweep amount.
  4. Increase the vault balance by that amount.
- Formula: Sweep Amount = Incoming Amount Ã— 0.15

### 5.4.7 Fraud and Anomaly Detection Module
- Function: Detects suspicious transactions such as abnormalities and duplicate charges.
- Working Logic: Each new expense is checked against the userâ€™s historical expense behaviour. If it is much larger than the usual pattern or if identical duplicate charges appear on the same day, the system marks the transaction as suspicious.
- Algorithm:
  1. Compare new expense with historical average of the same category.
  2. If amount > 2.5 Ã— historical average and amount > 1000, raise an outlier alert.
  3. If the same amount, same category, and same date already exists multiple times, raise a velocity spike alert.
- Formula/Threshold:
  - Outlier Rule: Alert if Expense Amount > 2.5 Ã— Category Average
  - Duplicate Rule: Alert if same category + same amount + same date is repeated

### 5.4.8 AI Advisor Module
- Function: Provides smart advice and financial suggestions in natural language.
- Working Logic: The advisor reads the userâ€™s message and searches for keywords such as save, invest, budget, split, or stability. Based on the intent, it generates recommendations such as savings targets, expense guidance, or projections.
- Algorithm:
  1. Read the chat message.
  2. Detect keywords.
  3. Generate context-based advice.
  4. Return a structured response to the UI.
- Formula/Projection Example: Compound growth can be projected using CAGR:
  Future Value = Present Value Ã— (1 + 0.072)^n

### 5.4.9 Advanced Forecasting Module (Dynamic Ensemble)
- Function: Predicts future income and expenses using multiple statistical models.
- Working Logic: The system uses an Ensemble Model containing 6 distinct algorithms (Linear Regression, Holt's Trend, Holt-Winters Seasonality, Mean Reversion, Double Exponential, and Croston's Method). Instead of a simple average, it actively back-tests historical data to calculate a "Mean Absolute Error" for each model, giving highest weight to the most accurate algorithm.
- Algorithm Highlights:
  - **Croston's Method:** Specifically isolates and predicts "lumpy" or intermittent gig-worker income (months with â‚¹0 earnings).
  - **Holt-Winters:** Captures recurring seasonal spikes (e.g., festival season earnings).
- Formula: Weighted Ensemble Forecast = ÃŽÂ£ (Model Projection Ãƒâ€” Dynamic Backtest Weight)

### 5.4.10 Data Seeding and Demo Persona Module
- Function: Creates realistic sample users and historical data for testing and demonstrations.
- Working Logic: On application startup, if the database is empty, the system creates demo personas and populates them with 9 months of mock income and expenses. Different professions receive different spending and income patterns to simulate real-world behaviour.
- Algorithm:
  1. If database is empty, seed users.
  2. Create income and expense records for each persona.
  3. Add assets, liabilities, and savings goals.
- Formula: Jittered value = Base Amount + Random Percentage of Base Amount

### 5.4.11 Multilingual Support (i18n) Module
- Function: Localizes the application UI into multiple regional languages (e.g., English, Hindi, Kannada, Tamil, Telugu) ensuring accessibility for diverse user demographics.
- Working Logic: The frontend utilizes a `LanguageContext` (via React Context API) wrapping the entire application. A translations dictionary securely maps text keys to localized strings. When the user selects a different language via the `LanguageSelector`, the global state updates, instantaneously triggering a UI re-render of all translated components.
- Algorithm: 
  1. Detect user language preference.
  2. Map the requested UI string key to the selected language dictionary.
  3. If the translation is missing, fallback to the default language (English).
- Formula / Lookup Rule: `Rendered_Text = translations[selected_language][key] OR translations['en'][key]`

## 6. Conclusion
FinGuard provides a robust, tailored solution for gig economy workers. By combining dynamic stability scoring, automated savings sweeps, and intelligent anomaly detection, it empowers users with variable incomes to manage their finances effectively, build resilience, and protect against financial shocks.

---

## 7. Project Exam Questions & Demo Answers (Viva / Defense Guide)

**Q1. Examiner: How exactly is the Financial Stability Index (FSI) calculated in your project? Can you explain the formula?**
**Answer:** The FSI is calculated by looking at two main factors: Income Volatility and Monthly Burn Rate. For volatility, we calculate the standard deviation of the user's income over the past 6 months and divide it by the mean income to get the Coefficient of Variation (CV). For the burn rate, we calculate the percentage of total income that goes towards fixed expenses like rent and bills. We then use a weighted algorithm that deducts points for high volatility and high burn rates, producing a final normalized score between 0 and 100.

**Q2. Examiner: How does the anomaly detection system work? Are you using machine learning?**
**Answer:** Our current implementation uses a deterministic rules-based algorithm rather than a heavy machine learning model, ensuring real-time performance and low overhead. When an expense is logged, the `FraudDetectionService` intercepts it. It checks two rules: 
1. **Outlier Spike:** Is the amount greater than 2.5 times the user's historical average for that specific category? 
2. **Velocity Spike:** Is there already a transaction for the exact same amount in the exact same category on the same day? 
If either rule triggers, a `FraudAlert` is generated and pushed to the user's dashboard immediately.

**Q3. Examiner: How is the Auto-Sweep or Cushion Vault feature implemented?**
**Answer:** The Auto-Sweep feature acts as an automated micro-savings tool. When it is toggled on, the system listens for any incoming transaction. Upon receiving income, a predefined percentage (set to 15% in our logic) is mathematically deducted from the available spending balance and allocated to the `stabilityVaultBalance`. The feature also respects the user's configured round-up threshold and only releases the bucket when there is an active savings goal; otherwise it preserves the funds as a reserve. This happens synchronously during the income logging process.

**Q4. Examiner: How did you handle the database seeding for testing different user personas?**
**Answer:** We implemented a `DataInitializer` class using Spring's `CommandLineRunner`. On application startup, it checks if the database is empty. If so, it creates 14 different worker profiles (like Freelancer, Delivery Driver, Maid). For expenses, it generates 5-6 typical monthly expenses using a random jitter function to simulate realistic varying amounts. For income, it loops to generate 1-2 entries per month (a primary salary + a 50% chance of a bonus), giving each persona 9 months of historically accurate financial data for testing.

**Q5. Examiner: Explain the architecture of your application.**
**Answer:** We use a modern three-tier architecture. The presentation tier is a Single Page Application built with React 18 and Vite, managing state and UI components. The application tier is a Java 17 Spring Boot backend that exposes RESTful APIs, secured via stateless JWT authentication. Finally, the data tier uses an H2 in-memory database for local testing, accessed via Spring Data JPA and Hibernate, which is fully compatible to be swapped to PostgreSQL for production.

**Q6. Examiner: How does the application predict future income for someone with highly irregular gig-work payouts?**
**Answer:** Predicting irregular gig-work is challenging because standard linear models fail when a worker earns â‚¹0 in a given month. To solve this, our prediction engine uses a Dynamically Weighted Ensemble of 6 algorithms. Most notably, we implemented **Croston's Method**, which is specifically designed for intermittent demand by separating the forecast into the "amount" of income and the "time interval" between payouts. Furthermore, the engine back-tests all 6 models against the user's history in real-time, assigning the highest weight to the algorithm that historically performed best for that specific user's income shape.

**Q7. Examiner: How did you implement Multilingual Support in the application without relying on external APIs for translation?**
**Answer:** We built a custom Internationalization (i18n) engine using React's Context API. We created a `LanguageContext` that wraps our component tree, providing a `translate(key)` function to all child components. The actual translations are stored in local JavaScript dictionary objects (JSON-like structures) for languages like Hindi, Kannada, Tamil, and Telugu. When the user changes their language from the header dropdown, the context state updates, causing the React DOM to instantly re-render with the mapped localized strings, falling back to English if a specific key is missing.

---

## 8. Live Demo Script — Step-by-Step Walkthrough

> **Purpose:** Use this script to confidently walk an examiner, panel, or audience through every working feature of FinGuard during a live demonstration. Each step tells you exactly what to click, what to say, and what the system will do.

---

### STEP 1 — Login & Authentication

**What to do:**
1. Open browser at `http://localhost:5173`.
2. Show the Login screen — point to the hero text on the left.
3. Enter username: `rajesh_k`, password: `password123`. Click Login.

**What to say:**
> "We use JWT-based authentication. When I enter credentials, the backend validates them, generates a secure token, and all further API calls carry that token in the Authorization header. No session cookies — it is completely stateless."

**What happens:** JWT is issued. Dashboard loads with Rajesh's 9-month seeded data.

---

### STEP 2 — Dashboard Overview

**What to do:**
1. Point to the 4 KPI cards: Balance, Savings Potential, Stability Score, Risk Level.
2. Show the Cash Flow Trend chart (cumulative inflow vs outflow).
3. Show the Expense Categories donut chart.
4. Scroll to the FSI Stability History bar chart.

**What to say:**
> "The dashboard aggregates everything — net balance, FSI score, cash flow trend, and expense breakdown — all from a single API call to /api/dashboard. The FSI and risk level are dynamically calculated from the user's history."

---

### STEP 3 — Financial Stability Index (FSI)

**What to do:**
1. Click the Financial Stability tab.
2. Point to three metric bars: Income Consistency, Monthly Burn Rate, Emergency Runway.
3. Show the Smart Advisor Report on the right.

**What to say:**
> "The FSI is our core algorithm. For Rajesh (delivery driver), the score is lower due to irregular income. Formula: FSI = 100 x (1 - 0.38 x BurnRate - 0.27 x Volatility - 0.22 x DebtRatio - 0.10 x SavingsGap). Higher volatility and higher burn rate push the score down. The Smart Advisor reads this score and generates tailored advice automatically."

---

### STEP 4 — Add Income (Auto-Sweep Demo)

**What to do:**
1. Click Income tab. Click Log Income Deposit.
2. Enter Rs 10,000, category Freelance, source "Upwork Client". Click Save.
3. Go to Profile > Stability Vault.

**What to say:**
> "When I log income, the Auto-Sweep module triggers immediately. Since auto-sweep is enabled, 15% of Rs 10,000 = Rs 1,500 is moved to the Cushion Vault automatically. The user builds an emergency buffer passively with every payout. Formula: Sweep Amount = Income x 0.15."

**What happens:** Vault balance increases by Rs 1,500. Dashboard updates instantly.

---

### STEP 5 — Cushion Vault & Round-Up Bucket

**What to do:**
1. Profile tab > Stability Vault section: show the vault balance, auto-sweep toggle, and UPI spending ceiling slider.
2. Savings tab: show Auto Round-Up Bucket and Active Savings Buckets.

**What to say:**
> "The Vault is the emergency reserve. We can also set a UPI spending ceiling — if monthly expenses cross the limit, a warning alert is raised. The round-up feature rounds every expense to the nearest Rs 10 and saves the spare change to active savings goals. If no goal exists, the money stays in the bucket as a micro-reserve."

---

### STEP 6 — Add Expense (Anomaly Detection Demo)

**What to do:**
1. Expense tab > Log Outflow item.
2. Enter Rs 50,000, category Shopping. Click Save.
3. Click Anomaly Detection tab.

**What to say:**
> "Now I trigger fraud detection. Rs 50,000 in Shopping is far above Rajesh's historical average. The FraudDetectionService checks: if Amount > 2.5 x Category Average, it flags an Outlier Spike. If the same amount/category/date repeats, it flags a Velocity Spike. Both alerts appear instantly on the Anomaly Detection tab."

**What happens:** Fraud alert generated and visible on Anomaly tab with severity label.

---

### STEP 7 — Future Income Prediction

**What to do:**
1. Dashboard tab > scroll to Future Income Projection chart.
2. Point to the bar chart showing 6 months ahead.

**What to say:**
> "The projection uses a Dynamic Ensemble of 6 algorithms: Linear Regression (trend), Holt's (smoothing), Holt-Winters (seasonal spikes), Mean Reversion (corrects extremes), Double Exponential (momentum), and Croston's Method — built specifically for gig workers with zero-income months. Each model is back-tested against the user's real history, error rates are calculated, and higher weights are given to the most accurate model. The final projection is a weighted sum."

---

### STEP 8 — Net Worth Tracker

**What to do:**
1. Net Worth tab: point to Total Assets, Total Liabilities, Net Worth KPI cards and bar chart.
2. Add Asset: "SBI Savings Account" Rs 80,000.
3. Add Liability: "Personal Loan" Rs 30,000 at 12% APR.

**What to say:**
> "Net Worth = Total Assets - Total Liabilities. Users can log savings accounts, property, investments as assets, and loans or credit card debt as liabilities. A liability with interest rate above 15% is highlighted red as a high-risk warning. This gives a real picture of long-term financial health beyond monthly cash flow."

---

### STEP 9 — Smart Advisor Chat

**What to do:**
1. Financial Stability tab > click Smart Advisor toggle.
2. Click chip "Savings Advice" or type "How can I save more money?"

**What to say:**
> "The Smart Advisor is a rule-based AI chat. It reads the user's live FSI score, balance, burn rate, and runway to generate personalized advice. It uses keyword intent matching — not a generic model. It works fully offline with no external AI API, so it runs even without internet."

---

### STEP 10 — Receipt Scanner

**What to do:**
1. Receipt tab: upload any receipt photo (JPG/PNG).
2. Show OCR running and extracting Merchant, Amount, Date.
3. Click Apply to Expense Form.

**What to say:**
> "The Receipt Scanner uses Tesseract.js — a browser-based OCR engine — to extract text from receipt photos. It automatically reads merchant name, amount, and date, then pre-fills the expense form with one click. No manual typing needed — especially useful for gig workers collecting physical receipts."

---

### STEP 11 — PDF Report Export

**What to do:**
1. Insights tab: show rule-based insight cards (burn rate, savings outlook, top category).
2. Click Download Report. Show the generated PDF.

**What to say:**
> "The Insights tab gives a rule-based financial health analysis. The PDF export — generated with jsPDF — includes the dashboard snapshot, expense breakdown, savings goals, FSI score, projections, and AI recommendations in a professional format ready to share or archive."

---

### STEP 12 — Multilingual Support

**What to do:**
1. Click Language selector in the top header.
2. Switch English to Hindi. Show all labels and buttons change instantly.
3. Switch to Tamil or Kannada.

**What to say:**
> "FinGuard supports 5 regional languages — English, Hindi, Tamil, Telugu, Kannada. We built a custom i18n engine using React Context API. All UI strings are in local JSON translation dictionaries. When language changes, the LanguageContext state updates and re-renders the entire UI instantly with no page refresh. No external translation API — works completely offline."

---

### STEP 13 — Switch User Personas

**What to do:**
1. Click Logout. Login as `priya_s` / `password123`.
2. Show the different FSI score and advice for a home tutor.

**What to say:**
> "We seeded 14 different worker personas — delivery driver, home tutor, IT freelancer, street vendor, domestic worker — each with 9 months of distinct income/expense history. Watch how the FSI score and recommendations are completely different for Priya. The system is fully personalized to each user's real data."

---

## 9. Demo User Credentials

| Username | Profession | Income Pattern |
|---|---|---|
| rajesh_k | Delivery Driver | Highly irregular / lumpy |
| priya_s | Home Tutor | Semi-stable |
| divya_t | IT Freelancer | Project-based |
| arjun_m | Street Vendor | Very irregular |
| lakshmi_r | Domestic Worker | Monthly fixed |

Password for all demo users: password123

---

## 10. Common Examiner Follow-Up Questions During Demo

**Q: What if the backend is down?**
A: The frontend falls back to locally cached data. FSI, balance, and advisor still work. A "Service Unavailable" banner informs the user.

**Q: Why H2 instead of MySQL?**
A: H2 requires zero external setup — ideal for exam demos. Switching to PostgreSQL needs only two lines changed in application.properties.

**Q: How is the JWT secured?**
A: Signed with HMAC-SHA256, containing username and expiry. The Spring Security filter validates signature and expiry on every request, rejecting tampered or expired tokens.

**Q: Is the AI using ChatGPT or Gemini?**
A: No. Fully rule-based, reads keyword intent from messages, generates advice from the user's live FSI score, balance, savings potential, and risk level. Works completely offline.

**Q: How does the Round-Up Bucket work?**
A: Every expense is rounded up to the nearest Rs 10. The difference (Rs 1-9) accumulates in the bucket. When it crosses the threshold (default Rs 100), it releases to the active savings goal. If no goal exists, it stays as a micro-reserve.

**Q: How many users did you test with?**
A: 14 seeded personas covering diverse professions and income patterns, each with 9 months of financial history, validating algorithms across all risk profiles.
