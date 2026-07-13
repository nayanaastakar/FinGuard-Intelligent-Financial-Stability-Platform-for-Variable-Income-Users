# FinGuard API 🛡️

**Intelligent Financial Stability Advisor & Transaction Anomaly Shield**

FinGuard API is a production-grade full-stack financial platform designed to help freelancers, gig-economy workers, and variable-income professionals manage their volatile cash flows. The platform calculates a dynamic Financial Stability Index (FSI), hosts a Cushion Vault (Stability Sweep), and detects real-time transaction anomalies.

---

## 🌟 Key Capabilities
* **Financial Stability Index (FSI)**: Evaluates income volatility, monthly burn rate, and balance thresholds to generate a dynamic safety index.
* **Stability Vault Configurator**: Supports automated payout sweeps (moves 15% of inbound income to reserves), UPI spending ceilings, and manual sandbox vault deposits.
* **Auto Round-Up Savings Bucket**: Supports a configurable round-up threshold with fallback reserve behavior when no active savings goals are available.
* **6-Month Trend Charting**: Displays a historical line chart tracking stability scores alongside an interactive Cushion Vault Status Panel.
* **Account Aggregator Consent Flow**: Simulates a high-fidelity Indian Open Banking linkage (via Sahamati framework) to pull live starting balances.
* **Conversational AI Advisor (AI Advisor)**: Suggests savings projections (7.2% CAGR yield), tactical budgets, proportional household expense splits, and flags outliers.
* **Real-time Anomaly Shield**: Dynamically flags double-billing velocity spikes and outlier expense transactions.

---

## 💻 Technology Stack
* **Frontend**: React 18, Vite, Recharts (visualizations), Lucide React (icons), Vanilla CSS (Slate Dark styling).
* **Backend**: Java 17, Spring Boot 3.2.x, Spring Data JPA, Spring Security (Stateless JWT).
* **Database**: H2 In-Memory DB (default for local sandbox dev) / PostgreSQL profile support.
* **API Documentation**: Springdoc OpenAPI (Swagger UI).

---

## 📂 Repository Layout
```text
FinGuardAPI/
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ src/main/java/com/finguard/api/
â”‚   â”‚   â”œâ”€â”€ config/          # JWT Security, Web CORS, Data Seeder
â”‚   â”‚   â”œâ”€â”€ controller/      # REST API Controllers (Swagger Annotated)
â”‚   â”‚   â”œâ”€â”€ dto/             # Immutable Java 17 records
â”‚   â”‚   â”œâ”€â”€ entity/          # JPA Hibernate Entities
â”‚   â”‚   â”œâ”€â”€ exception/       # Global RestAdvice Interceptors
â”‚   â”‚   â”œâ”€â”€ repository/      # Spring Data JPA interfaces
â”‚   â”‚   â””â”€â”€ service/         # Business Logic, FSI Math, Anomaly Interceptors
â”‚   â”œâ”€â”€ pom.xml              # Maven configuration
â”‚   â””â”€â”€ Dockerfile
â”œâ”€â”€ frontend/
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ App.jsx          # Main SPA (State management, API integration, views)
â”‚   â”‚   â”œâ”€â”€ index.css        # Slate Dark global stylesheets and utility classes
â”‚   â”‚   â””â”€â”€ main.jsx         # React DOM renderer
â”‚   â”œâ”€â”€ package.json         # npm dependencies
â”‚   â”œâ”€â”€ vite.config.js       # Vite configuration
â”‚   â””â”€â”€ Dockerfile
â””â”€â”€ docker-compose.yml       # Orchestrated multi-stage local containers
```

---

## 🚀 Getting Started

### Option A: Manual Local Startup (Recommended)

#### 1. Spin Up the Spring Boot Backend
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Compile and run the server using the Maven wrapper:
   ```bash
   ./mvnw spring-boot:run
   ```
3. The server starts on port **`9080`**.
   * **API Swagger Console**: [http://localhost:9080/swagger-ui.html](http://localhost:9080/swagger-ui.html)
   * **H2 Database Console**: [http://localhost:9080/h2-console](http://localhost:9080/h2-console) (JDBC URL: `jdbc:h2:mem:finguarddb`, Username: `sa`, Password: `password`)

#### 2. Spin Up the React Frontend
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Boot the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to [http://localhost:5173/](http://localhost:5173/).

---

### Option B: Docker Orchestration
If you prefer to run both tiers in isolated containers:
1. Ensure Docker Desktop is active.
2. From the root repository folder, run:
   ```bash
   docker-compose up --build
   ```
3. Access the services:
   * **Frontend UI**: `http://localhost`
   * **Backend REST API**: `http://localhost:8080`

---

## 🔑 Sandbox Credentials
To access pre-seeded 180-day historical worker datasets, use the following credentials on the login screen:

* **Password (Common for all accounts)**: `password123`

| Username | Full Name | Profession / Persona |
| :--- | :--- | :--- |
| `demo` | John Doe | Freelance UI/UX Designer |
| `priya_s` | Priya Sharma | Delivery Driver - Uber/Ola |
| `kabir_v` | Kabir Verma | YouTuber & Content Creator |
| `rahul_d` | Rahul Das | Quick Commerce Rider (Zepto/Blinkit) |
| `amit_p` | Amit Patel | Urban Company Plumber & Service Pro |
| `rajesh_k` | Rajesh Kumar | Daily Wage Construction Laborer |
| `divya_t` | Divya Deva | Freelance Online Tutor |

---

## 🛡️ REST API Endpoint Summary
All transactional routes require a stateless Bearer token: `Authorization: Bearer <token>`.

| Route | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Create a new user profile |
| `/api/auth/login` | `POST` | Authenticate and obtain JWT token |
| `/api/dashboard` | `GET` | Fetch unified stats, notifications, alerts, and summaries |
| `/api/income` | `POST` / `GET` | Log or view freelance payouts |
| `/api/expense` | `POST` / `GET` | Log or view expenses (triggers anomaly interceptors) |
| `/api/stability` | `GET` | Fetch latest calculated stability indexes and advice |
| `/api/fraud/alerts` | `GET` / `PUT` | View or resolve flagged transaction warnings |

---

## ðŸ›¢ï¸ H2 Database Inspection Console
To inspect the live seeded database tables in real-time:
1. Open the H2 Web Console: [http://localhost:9080/h2-console](http://localhost:9080/h2-console)
2. Enter the following JDBC credentials:
   * **JDBC URL**: `jdbc:h2:mem:finguarddb`
   * **User Name**: `sa`
   * **Password**: `password`
3. Click **Connect** to query database tables like `USERS`, `TRANSACTIONS`, `EXPENSES`, and `INCOMES` directly.

---

## ðŸ› ï¸ Code-Level Implementation Details

Here is the location and logical flow of the core features in the codebase:

1. **Financial Stability Index (FSI) Calculations**:
   * **File**: [StabilityService.java](file:///c:/Users/poorn/Desktop/FinGuardAPI/backend/src/main/java/com/finguard/api/service/StabilityService.java)
   * **Logic**: Evaluates historical `incomes` and `expenses` over 180 days. Computes the *coefficient of variation* (Standard Deviation / Mean) of user income streams to measure volatility. Combines this mathematically with the *monthly fixed burn rate* (Bills/Rent relative to overall earnings) to compute a score between 0 and 100.

2. **Cushion Vault Sweep (Auto-Sweep)**:
   * **File**: [App.jsx](file:///c:/Users/poorn/Desktop/FinGuardAPI/frontend/src/App.jsx) (inside `handleAddIncome`)
   * **Logic**: When an income transaction is added, the React controller checks if `isAutoSweepActive` is true and applies the user's configured round-up threshold. If active, it calculates `15%` of the amount and sweeps it into the `stabilityVaultBalance` state, updating the UI balance indicators in real-time. The bucket only releases funds to goals when active savings goals exist; otherwise it preserves the balance as a reserve.

3. **UPI Ceiling Limit breaches**:
   * **File**: [App.jsx](file:///c:/Users/poorn/Desktop/FinGuardAPI/frontend/src/App.jsx) (inside `handleAddExpense`)
   * **Logic**: On logging an expense, the app sums all expenses logged during the current calendar month. It compares the sum against the `cardLimitValue` state (configured using the range slider on the Profile tab). If the limit is crossed, it pushes a `LIMIT_SPIKE` notification warning to the dashboard banner.

4. **Sahamati Account Aggregator bank linking**:
   * **File**: [App.jsx](file:///c:/Users/poorn/Desktop/FinGuardAPI/frontend/src/App.jsx) (inside `AccountAggregatorModal` component)
   * **Logic**: A multi-step React modal state machine. It transitions from Bank Picker -> Mobile handle input -> OTP Validation (requires OTP `123456`). Once validated, it pushes the bank account to `profileDetails.linkedAccounts`, updates `localStorage`, and imports a mock starting balance of **`₹45,000.00`** to simulate a live bank fetch.

5. **Real-time Transaction Anomaly Detection**:
   * **File**: [FraudDetectionService.java](file:///c:/Users/poorn/Desktop/FinGuardAPI/backend/src/main/java/com/finguard/api/service/FraudDetectionService.java)
   * **Logic**: Runs inside the database transactions lifecycle. When a new `Expense` is saved, it queries the `ExpenseRepository` for the user's category averages.
     * **Outlier Spike**: Flags as anomaly if transaction amount is **> 2.5x** of the category average.
     * **Velocity Spike**: Flags as anomaly if an identical category/amount exists on the same calendar day.
     If a rule is broken, it creates a `FraudAlert` record in the database, triggering the warning indicator.

6. **Conversational AI Advisor Chat**:
   * **File**: [App.jsx](file:///c:/Users/poorn/Desktop/FinGuardAPI/frontend/src/App.jsx) (`handleSendChatMessage` and `renderMarkdownText`)
   * **Logic**: Matches keywords (e.g. *invest*, *save*, *split*) in user text input:
     * **CAGR Projection**: Computes compound savings growth over 1, 3, and 5 years at a **7.2% CAGR**.
     * **Proportional splits**: Takes the user's average monthly income and splits bills proportionally with a partner earning ₹30,000 baseline.
     * **Markdown Renderer**: Regex-parses headings, bold phrases, and list bullets into styled HTML badges.

