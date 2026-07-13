# FinGuard API Lab Guide

This guide explains how the FinGuard API works in depth. It assumes you are learning the API from scratch and walks through the backend architecture, request flow, authentication, major endpoints, and the AI advisor logic.

## 1. Project Overview

FinGuard is a Spring Boot-based backend API that supports a personal finance dashboard. It includes:

- user authentication and JWT-based security
- income and expense tracking
- net worth asset/liability tracking
- savings goals management
- financial stability scoring
- an AI advisor endpoint that can use real providers or a deterministic algorithmic advisor

The server runs on `http://localhost:9080` by default.

## 2. Backend Architecture

### 2.1 Spring Boot and Controller Layer

The backend uses Spring Boot and a classic layered architecture:

- `controller` classes expose HTTP endpoints
- `service` classes implement business logic
- `repository` classes interact with the database
- `dto` classes define request and response models
- `entity` classes define persisted data objects

Important controller files:

- `backend/src/main/java/com/finguard/api/controller/AuthController.java`
- `backend/src/main/java/com/finguard/api/controller/DashboardController.java`
- `backend/src/main/java/com/finguard/api/controller/ExpenseController.java`
- `backend/src/main/java/com/finguard/api/controller/IncomeController.java`
- `backend/src/main/java/com/finguard/api/controller/NetWorthController.java`
- `backend/src/main/java/com/finguard/api/controller/NotificationController.java`
- `backend/src/main/java/com/finguard/api/controller/SavingsGoalController.java`
- `backend/src/main/java/com/finguard/api/controller/StabilityController.java`
- `backend/src/main/java/com/finguard/api/controller/AdvisorController.java`

Each controller is annotated with `@RestController` and maps to a base path such as `/api/auth` or `/api/advisor`.

### 2.2 Security and Authentication

Security is handled by JWT tokens and Spring Security.

Key files:

- `backend/src/main/java/com/finguard/api/config/SecurityConfig.java`
- `backend/src/main/java/com/finguard/api/config/ApplicationConfig.java`
- `backend/src/main/java/com/finguard/api/service/AuthService.java`

#### SecurityConfig

`SecurityConfig` configures:

- CSRF disabled for API usage
- CORS allowed for frontend ports like `http://localhost:5173`
- public endpoints under `/api/auth/**`, Swagger, and H2 console
- all other endpoints require authentication
- stateless JWT session management
- the JWT filter is inserted before username/password authentication

#### AuthService

`AuthService` implements:

- user registration with password hashing via BCrypt
- login using `AuthenticationManager`
- JWT token generation via `JwtService`
- profile loading using username from the JWT subject
- profile updates for name, profession, savings goal, and auto-roundup settings

#### ApplicationConfig

`ApplicationConfig` provides:

- a `UserDetailsService` to load users from the database
- a `DaoAuthenticationProvider` wired with the `PasswordEncoder`
- a `BCryptPasswordEncoder`

### 2.3 Configuration Properties

The application uses `backend/src/main/resources/application.yml`.

Important config entries:

- server port: `9080`
- JWT secret and expiration
- `application.ai` properties for AI advisor provider configuration
- in-memory H2 database for development
- PostgreSQL profile for production

Example AI config section:

```yaml
application:
  ai:
    enabled: true
    provider: ${FINGUARD_AI_PROVIDER:gemini}
    api-key: ${FINGUARD_AI_API_KEY:}
    model: ${FINGUARD_AI_MODEL:gemini-2.0-flash}
    base-url: ${FINGUARD_AI_BASE_URL:https://generativelanguage.googleapis.com/v1beta}
    max-history-messages: 8
    timeout-seconds: 45
```

## 3. How a Request Flows Through the API

### 3.1 Login and JWT issuance

1. Frontend sends `POST /api/auth/login` with username/password.
2. `AuthController.login()` calls `authService.login()`.
3. Spring Security authenticates the credentials.
4. `AuthService` returns `AuthResponse` containing a JWT token.
5. Frontend stores the token and sends it in `Authorization: Bearer <token>` for later requests.

### 3.2 Secured request flow

For any protected endpoint:

1. Request arrives with `Authorization` header.
2. `JwtAuthenticationFilter` extracts the JWT and validates it.
3. If valid, Spring Security sets the user principal.
4. Controller receives a `Principal` or `Authentication` object.
5. Controller calls `authService.getAuthenticatedUser(principal.getName())` to load the full `User` object.
6. Business logic is executed.
7. Controller returns a JSON response.

## 4. Major API Endpoints

### 4.1 Authentication

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/register` | POST | Create a new user account and return JWT token |
| `/api/auth/login` | POST | Authenticate credentials and return JWT token |
| `/api/auth/profile` | GET | Get the current logged-in user profile |
| `/api/auth/profile` | PUT | Update user profile data |

### 4.2 Dashboard

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/dashboard` | GET | Return aggregated dashboard summary data |

### 4.3 Expense

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/expense` | POST | Add a new expense record |
| `/api/expense` | GET | Retrieve expense history |
| `/api/expense/{id}` | PUT | Update an existing expense |
| `/api/expense/{id}` | DELETE | Delete an expense |

### 4.4 Income

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/income` | POST | Add a new income record |
| `/api/income` | GET | Retrieve income history |
| `/api/income/{id}` | PUT | Update an income record |
| `/api/income/{id}` | DELETE | Delete an income record |

### 4.5 Net Worth

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/networth/assets` | GET | Get all assets for authenticated user |
| `/api/networth/assets` | POST | Add a new asset |
| `/api/networth/assets/{id}` | DELETE | Delete an asset |
| `/api/networth/liabilities` | GET | Get all liabilities |
| `/api/networth/liabilities` | POST | Add a liability |
| `/api/networth/liabilities/{id}` | DELETE | Delete a liability |

### 4.6 Notifications

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/notifications` | GET | List notifications |
| `/api/notifications/{id}/read` | PUT | Mark a notification read |
| `/api/notifications/read-all` | PUT | Mark all notifications read |

### 4.7 Savings Goals

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/savings-goals` | GET | List savings goals |
| `/api/savings-goals` | POST | Create a savings goal |
| `/api/savings-goals/{id}/contribute` | POST | Contribute to or withdraw from a savings goal |
| `/api/savings-goals/{id}` | DELETE | Delete a savings goal |

### 4.8 Stability

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/stability` | GET | Get financial stability metrics and predictions |

### 4.9 AI Advisor

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/advisor/chat` | POST | Chat with the advisor using the current AI provider |

## 5. Advisor Endpoint Deep Dive

### 5.1 What the advisor does

The advisor endpoint is implemented by:

- `backend/src/main/java/com/finguard/api/controller/AdvisorController.java`
- `backend/src/main/java/com/finguard/api/service/AiAdvisorService.java`
- `backend/src/main/java/com/finguard/api/service/AdvisorAlgorithmicService.java`
- `backend/src/main/java/com/finguard/api/service/AdvisorFallbackService.java`
- `backend/src/main/java/com/finguard/api/config/AiProperties.java`

The endpoint takes a request body with `message` and `history`, then returns a response with `reply`, `provider`, and `realAiUsed`.

### 5.2 How the advisor chooses behavior

`AiAdvisorService.chat()` does these steps:

1. Load the authenticated user from JWT
2. Build dashboard summary from `DashboardService`
3. Calculate stability metrics from `StabilityService`
4. Build a prompt used for external providers
5. If AI is enabled and credentials are available, call the configured provider
6. If provider returns a reply, send it back
7. If provider fails or is disabled, use fallback logic

### 5.3 Available provider types

The system supports these provider values in `application.yml` or environment variables:

- `openai` — uses OpenAI-compatible chat completions API
- `gemini` — uses Google Gemini compatible API
- `ollama` — uses a local Ollama chat API
- `algorithmic` — uses the deterministic advisor algorithm implemented in `AdvisorAlgorithmicService`

For `algorithmic`, the code does not call an external LLM. It instead computes the best response from financial data and user message intent.

### 5.4 Algorithmic advisor logic

`AdvisorAlgorithmicService` performs the following:

- extracts user financial features such as income, expense, balance, FSI, savings potential, and volatility
- counts active fraud alerts
- scores the user message for keywords in categories like savings, investing, budget, stability, and anomalies
- combines the message score with financial signals using weighted scoring
- chooses a final response category:
  - `SAVINGS`
  - `INVESTMENT`
  - `BUDGET`
  - `STABILITY`
  - `ANOMALY`
  - `SUMMARY`
- generates a detailed markdown-formatted reply based on the selected category

This is a deterministic, rule-driven algorithmic advisor designed for stability without using machine learning.

### 5.4.5 AdvisorController and request flow

The HTTP entry point is `backend/src/main/java/com/finguard/api/controller/AdvisorController.java`.

- The controller maps `POST /api/advisor/chat`.
- It receives `AdvisorChatRequest` containing `message` and optional `history`.
- It authenticates the user via `Principal`.
- It loads the current `User` using `AuthService.getAuthenticatedUser()`.
- It forwards the request to `AiAdvisorService.chat()`.

This means the advisor endpoint always runs inside the authenticated user context and uses the current user's profile and financial data.

### 5.4.6 AiAdvisorService chat logic

`AiAdvisorService.chat()` is the core advisor orchestration method.

Steps:
1. Load the current dashboard summary from `DashboardService.getDashboardSummary(user)`.
2. Calculate stability metrics from `StabilityService.calculateStability(user)`.
3. Build a `systemPrompt` with user profile, income/expense totals, balance, FSI score, savings potential, volatility, and active alerts.
4. Check if AI is enabled and credentials are available via `aiProperties.isEnabled()` and `aiProperties.hasCredentials()`.
5. If enabled, call `callProvider(...)` and return its reply if non-empty.
6. If the provider call throws, returns no text, or AI is disabled, use `AdvisorFallbackService.buildFallbackReply(...)`.

The response object includes:
- `reply`: the advisor text
- `provider`: the chosen provider name
- `realAiUsed`: `false` for `algorithmic` or fallback, `true` for actual LLM providers

### 5.4.7 AI provider switching

`AiAdvisorService.callProvider()` switches by provider name:

- `openai` → `callOpenAiCompatible(...)`
- `gemini` → `callGemini(...)`
- `ollama` → `callOllama(...)`
- `algorithmic` → `callAlgorithmic(...)`

The provider name is controlled in `application.yml` or environment variables through `application.ai.provider`.

### 5.4.8 External provider request wrappers

Each external provider method builds its HTTP request differently:

- `callOpenAiCompatible()` uses the OpenAI-style `/chat/completions` API with a list of messages.
- `callGemini()` uses the Gemini-style `models/{model}:generateContent` API with a `systemInstruction` and `contents` array.
- `callOllama()` uses the local Ollama `/api/chat` endpoint with a system message and history.

All three methods include the current prompt, the user's question, and optionally trimmed conversation history.

The helper methods `appendHistory()` and `appendGeminiHistory()` normalize historical roles and filter out blank messages.

### 5.4.9 Algorithmic provider details

When `application.ai.provider` is set to `algorithmic`, the backend does not call any external LLM.

`AiAdvisorService.callAlgorithmic(...)` delegates to `AdvisorAlgorithmicService.buildAlgorithmicReply(...)`.

That service:
- extracts financial signals from `DashboardSummary` and `StabilityResponse`
- computes `income`, `expense`, `balance`, `fsi`, `savingsPotential`, `volatility`, `activeAlerts`, and `runway`
- scores the user's message against keyword sets for savings, investing, budgeting, stability, and anomalies
- normalizes numeric signals and combines them with message relevance to rank advice categories
- selects one of: `SAVINGS`, `INVESTMENT`, `BUDGET`, `STABILITY`, `ANOMALY`, or `SUMMARY`
- generates a markdown response tailored to that category with practical recommendations

This is a rule-based scoring algorithm, not machine learning. It is deterministic and reproducible.

### 5.4.10 Fallback advisor logic

`AdvisorFallbackService.buildFallbackReply(...)` is the last-resort answer path.

It uses simple keyword matching on the user's message to choose one of several fallback responses:
- savings advice
- investment guidance
- budgeting framework
- FSI/stability diagnostics
- anomaly alert status
- general profile summary

It also builds values such as `runway`, `suggestedSweep`, and a `targetSavings` fallback when needed.

This path is used when AI is disabled, an external provider fails, or no algorithmic reply is produced.

### 5.4.11 AI property and credentials logic

`AiProperties.hasCredentials()` controls whether the system treats the provider as usable.

- For `ollama` and `algorithmic`, it returns `true` even without an API key.
- For `openai` and `gemini`, it requires a non-empty `apiKey`.

This is why `algorithmic` runs locally without external API keys.

## 5.5 Dashboard and Stability Calculation Algorithms

The dashboard and stability endpoints are the core financial intelligence of the app. They are implemented in:

- `backend/src/main/java/com/finguard/api/service/DashboardService.java`
- `backend/src/main/java/com/finguard/api/service/StabilityService.java`
- `backend/src/main/java/com/finguard/api/service/ForecastService.java`

### 5.5.1 DashboardService.getDashboardSummary()

This method builds the dashboard payload in one pass.

Steps:

1. Load user incomes and expenses:
   - `incomeService.getUserIncomes(user)` returns all income records.
   - `expenseService.getUserExpenses(user)` returns all expense records.
   - `transactionService.getUserTransactions(user)` returns combined transactions.

2. Calculate raw totals:
   - `totalIncome = sum(income.amount)`
   - `totalExpense = sum(expense.amount)`
   - `balance = totalIncome - totalExpense`

3. Ask `StabilityService` for stability metrics:
   - `stabilityService.calculateStability(user)` returns the FSI score, risk label, savings potential, volatility, forecast values, and AI suggestions.

4. Choose recent transactions:
   - `recentTransactions = transactions.limit(10)` keeps the latest 10 rows for the dashboard feed.

5. Build category distributions:
   - `expensesByCategory` groups expenses by `Expense.category` and sums values.
   - `incomesByCategory` groups incomes by `Income.category` and sums values.

6. Build alerts and notifications:
   - `notifications` uses `notificationService.getUserNotifications(user).limit(5)`.
   - `fraudAlerts` uses `fraudDetectionService.getUserFraudAlerts(user).limit(5)`.

7. Return a `DashboardSummary` object with all values.

So the dashboard is not doing complex math itself. It simply aggregates raw ledger data and enriches it with the stability score and forecasts calculated by `StabilityService`.

### 5.5.2 StabilityService.calculateStability()

This method contains the actual financial scoring formulas.

#### Step 1: monthly buckets

- The code keeps the last 9 months of data.
- It maps income and expense dates into `YearMonth` buckets.
- It creates two lists of length 9: `incomeMonthly` and `expenseMonthly`.
- Empty months are filled with `0.0`.

This means the calculations always use 9 fixed periods, even if some months have zero activity.

#### Step 2: averages

- `avgIncome = totalIncome / monthsToKeep`
- `avgExpense = totalExpense / monthsToKeep`

Where `totalIncome` and `totalExpense` are the sums of the 9 monthly buckets.

#### Step 3: income volatility

The code computes income volatility using standard deviation:

- `variance = sum((amt - avgIncome)^2)` across each monthly income bucket
- `stdDevIncome = sqrt(variance / n)` where `n` is the number of months
- `volatilityIndex = stdDevIncome / avgIncome` if `avgIncome > 0`

This is the coefficient of variation, which expresses how much income swings relative to the average.

#### Step 4: burn rate

- `burnRate = avgExpense / avgIncome` if `avgIncome > 0`

This is the proportion of income that is spent. A burn rate of 0.7 means 70% of income is used on expenses.

#### Step 5: assets, liabilities, and net worth

- `totalAssets = sum(asset.value)`
- `totalLiabilities = sum(liability.value)`
- `netWorth = totalAssets - totalLiabilities`

The code also creates an interest-weighted debt value:

- `weightedLiabilities = sum(liability.value * (1 + min(interestRate, 100%) / 100))`

This penalizes high-interest debt more strongly.

Then it computes a debt ratio:

- `debtToAssetRatio = weightedLiabilities / totalAssets` when assets exist
- otherwise `debtToAssetRatio = 1.0` when assets are zero and there is debt

This ratio measures leverage relative to the asset base.

#### Step 6: savings goal gap

If the user has a target savings amount, the code computes:

- `savingsPotentialNow = max(0, avgIncome - avgExpense)`
- `ratio = savingsPotentialNow / targetSavings`
- `savingsGoalGap = max(0, min(1, 1 - ratio))`

This gives a value between 0.0 and 1.0:

- `0.0` means the user is meeting or exceeding the savings target
- `1.0` means the user is far behind the target

#### Step 7: the FSI score formula

The Stability Score is calculated using a weighted combination of risk factors:

```
rawScore = 100 * (
    1.0
    - 0.38 * burnRate
    - 0.27 * min(1.0, volatilityIndex)
    - 0.22 * min(1.0, debtToAssetRatio)
    - 0.10 * savingsGoalGap
)
```

Then the score is capped:

- `fsiScore = max(5.0, min(98.0, rawScore))`
- if `currentBalance < 0`, the score is further capped at `30.0`

This means the score is always between `5` and `98`, and negative cash balance forces a poor score.

#### Step 8: savings potential and risk label

- `savingsPotential = max(0.0, avgIncome - avgExpense)`

Risk label logic:

- `LOW` if `fsiScore >= 75`
- `MEDIUM` if `45 <= fsiScore < 75`
- `HIGH` if `fsiScore < 45`

This maps the continuous score into three user-facing buckets.

#### Step 9: notifications

If the risk label is `HIGH`, the service creates a notification:

- title: `Financial Stability Warning`
- message includes the score and burn rate
- type: `OVERSPENDING`

This is how the app alerts the user to urgent risk.

#### Step 10: AI suggestions text

The method `buildAiSuggestions(...)` creates a natural-language recommendation summary.

It includes:

- score and net worth
- income volatility and burn rate
- savings goal progress
- tailored action steps for low, medium, and high score ranges

This text is returned to the frontend and also stored in the stability record.

#### Step 11: forecast calculations

The service saves a stability record and then forecasts future values using `ForecastService`.

- `predictedIncome = forecastService.forecastNextMonth(incomeMonthly)`
- `predictedExpense = forecastService.forecastNextMonth(expenseMonthly)`
- `recommendedSavings = max(0, predictedIncome - predictedExpense)`

It also produces 6-month projections:

- `projectedIncome = forecastService.forecastNextNMonths(incomeMonthly, 6)`
- `projectedExpense = forecastService.forecastNextNMonths(expenseMonthly, 6)`

And it builds month labels like `Apr 2026` for charting.

### 5.5.3 ForecastService algorithms

`ForecastService` uses an ensemble of two time-series methods:

#### Linear regression

It treats each month as an x-value:

- x = 1, 2, ..., n
- y = value in that month

Then it computes:

- `slope = (n*sum(x*y) - sum(x)*sum(y)) / (n*sum(x^2) - sum(x)^2)`
- `intercept = (sum(y) - slope*sum(x)) / n`

The predicted value for future month `n+i` is:

- `linRegProj = intercept + slope * (n + i)`

#### Double exponential smoothing (Holt's linear trend)

It also computes a Holt forecast:

- `alpha = 0.6`, `beta = 0.4`
- `s = series.get(0)` initial level
- `b = series.get(1) - series.get(0)` initial trend

For each historical point:

- `lastS = s`
- `s = alpha*y + (1-alpha)*(s + b)`
- `b = beta*(s - lastS) + (1-beta)*b`

Then for future period `i`:

- `holtProj = s + i * b`

#### Ensemble forecast

Finally, it averages the two forecasts:

- `ensembleProj = (linRegProj + holtProj) / 2`

This gives the final prediction for each future month.

#### Fallback for too little data

If there are fewer than 3 useful non-zero months, the service simply returns the average of the non-zero months instead of forecasting.

### 5.5.4 Practical meaning of these formulas

The forecast pipeline preserves recent monthly expense fluctuation by blending linear regression and Holt smoothing instead of flattening volatility into a single constant value. This helps the system reflect real expense swings in its 6-month projections.

In plain language:

- `DashboardService` gathers raw financial numbers and formats them for the UI.
- `StabilityService` converts those numbers into a stability score and risk signal.
- `ForecastService` predicts next-month income and expense using two common time-series models.

The most important formulas are:

- `balance = totalIncome - totalExpense`
- `burnRate = avgExpense / avgIncome`
- `volatilityIndex = stdDevIncome / avgIncome`
- `debtToAssetRatio = weightedLiabilities / totalAssets`
- `rawScore = 100 * (1 - 0.38*burnRate - 0.27*volatilityIndex - 0.22*debtToAssetRatio - 0.10*savingsGoalGap)`

These drive the FSI score, the risk label, and the advisor recommendations.

## 6. DTOs and Data Contract

The advisor request object is defined in:

- `backend/src/main/java/com/finguard/api/dto/AdvisorChatRequest.java`

It contains:

- `message` (String) — the user prompt
- `history` (List of `AdvisorChatMessageDto`) — prior chat turns

The advisor response object is defined in:

- `backend/src/main/java/com/finguard/api/dto/AdvisorChatResponse.java`

It contains:

- `reply` (String) — the advisor text
- `provider` (String) — active provider name
- `realAiUsed` (boolean) — whether a real LLM provider was used

## 7. Learning by Example

### 7.1 Register and login flow

1. Send `POST /api/auth/register` with JSON:

```json
{
  "username": "testuser",
  "password": "password123",
  "email": "test@example.com",
  "fullName": "Test User",
  "profession": "Freelancer"
}
```

2. Receive a response with `token`.
3. Send `POST /api/auth/login` with JSON:

```json
{
  "username": "testuser",
  "password": "password123"
}
```

4. Use the returned `token` for future requests:

```
Authorization: Bearer <token>
```

### 7.2 Call the advisor algorithmically

Send `POST /api/advisor/chat` with:

```json
{
  "message": "How can I save more this month?",
  "history": []
}
```

If the provider is configured as `algorithmic`, the advisor returns a computed response without calling a remote LLM.

## 8. Running the Server Locally

### 8.1 Use the bundled Maven wrapper

From `backend` folder:

```powershell
cd c:\Users\poorn\Downloads\api\FinGuardAPI-main\backend
.\mvnw.cmd spring-boot:run
```

### 8.2 Use the default in-memory database

The default profile uses H2 in-memory DB, so you can start and test immediately.

### 8.3 Using Swagger UI

Once the server is running, open:

```
http://localhost:9080/swagger-ui.html
```

This shows all available endpoints and lets you try them interactively.

## 9. Important Notes for an API Lab

### 9.1 What you should understand

- `Controller` = HTTP interface
- `Service` = business logic
- `Repository` = database access
- `DTO` = data transfer object
- `Entity` = persisted database record
- `JWT` = stateless authentication token

### 9.2 How authorization works

- `/api/auth/**` is public
- everything else requires a valid JWT
- JWT is created on login and validated on every request

### 9.3 How the advisor fits into the system

The advisor is just another secured API endpoint. It uses user context from the authenticated user and aggregates information from dashboard and stability services. It can route to real LLM endpoints or use a local algorithmic advisor depending on configuration.

## 10. Summary

This guide gave you:

- architecture of the FinGuard API
- detailed endpoint list and request flow
- security and JWT basics
- the advisor endpoint internals
- the new `algorithmic` provider behavior
- examples of how to use the API in a lab-style learning environment

If you want, I can also add a second guide that walks through the Java service implementation line-by-line.