# FinGuard: Comprehensive Exam Preparation Guide

## 1. Core Algorithms & Mathematical Formulas

FinGuard relies on several proprietary algorithms to automate financial stability. Here is how they work under the hood:

### A. Financial Stability Index (FSI)
The FSI is a dynamic score (0-100) calculated by the `StabilityService` backend engine. It assesses the user's financial resilience.

**Key Formulas:**
1. **Savings Rate:** 
   `Savings_Rate = ((Total_Income - Total_Expenses) / Total_Income) * 100`
2. **Debt-to-Asset Ratio:** 
   `Debt_Ratio = (Total_Liabilities / Total_Assets) * 100`
3. **Runway (Months of Survival):** 
   `Runway = Total_Assets / Average_Monthly_Expenses`

**Algorithm Logic:**
- **Base Score:** The algorithm starts everyone at a baseline of `50`.
- **Bonuses:** Adds up to `+25` points if `Savings_Rate > 20%`. Adds `+15` points if `Runway > 6 months` (indicating a healthy emergency fund).
- **Penalties:** Deducts `-20` points if `Debt_Ratio > 40%`. Deducts `-15` points for extreme income volatility (e.g., varying gig payouts without a safety net).

### B. Auto Round-Ups Algorithm
This engine simulates micro-investing by capturing "spare change" from everyday transactions.
**Formula:**
`Round_Up_Amount = Math.ceil(Transaction_Amount / 10) * 10`
`Spare_Change = Round_Up_Amount - Transaction_Amount`
*Example:* A coffee costs ₹234. The engine rounds it up to ₹240. The ₹6 difference is automatically swept into the user's active 'Savings Bucket'.

### C. Anomaly & Fraud Detection Engine
This algorithm monitors the `ExpenseRepository` for irregularities to protect the user.
**Logic:**
1. It calculates the moving average of the user's spending in specific categories over the last 90 days.
2. If a new transaction `T` is **> 150%** of the historical category average, it is flagged as `OVERSPENDING`.
3. If a transaction occurs at an unusual time (e.g., 3:00 AM) or exceeds a hardcoded safety threshold (e.g., > ₹50,000 in one swipe), it triggers a `FRAUD` alert notification.

### D. Receipt OCR Extraction Heuristics
The frontend uses `Tesseract.js`. Because raw OCR is messy, we built a custom heuristic scrubbing engine.
**Logic:**
1. **Noise Reduction Regex:** `text.replace(/^[^\w]+/g, '')` strips out random symbols caused by store logos (e.g., preventing a pharmacy cross `+` from being read as `#`).
2. **Amount Hunting:** The algorithm specifically hunts for bounding keywords (`"Total"`, `"Grand Total"`, `"Amount Due"`) to isolate the final price rather than accidentally pulling the "Taxable Amount".

---

## 2. API Architecture & Endpoints

The system uses a stateless RESTful architecture communicating via JSON. 

### Authentication (`AuthController`)
- **`POST /api/auth/login`**: Accepts `{username, password}`. Validates credentials using Spring Security and returns a `JWT (JSON Web Token)`. The frontend stores this token and passes it in the `Authorization: Bearer <token>` header for all subsequent requests.

### Core Data (`DashboardController` & `ExpenseController`)
- **`GET /api/dashboard/summary`**: An aggregator endpoint. Instead of making the frontend call 5 different APIs, this endpoint queries the Income, Expense, NetWorth, and Stability repositories simultaneously and returns a unified `DashboardSummaryDto` to render the UI instantly.
- **`POST /api/expenses`**: Accepts `{amount, category, description, date}`. Triggers the Anomaly Detection Engine asynchronously before saving to the H2 database.

### Net Worth (`NetWorthController`)
- **`POST /api/networth/assets`**: Adds a new asset.
- **`DELETE /api/networth/assets/{id}`**: Deletes an asset. *Note: This returns an empty `200 OK` response, which required custom JSON parsing on the frontend to prevent crash errors during UI state reloads.*

---

## 3. Major Challenges Faced During the Build

If the examiner asks: *"What was the most difficult part of this project?"*

**1. Managing Asynchronous UI State (The Auto-Reload Bug)**
*Challenge:* When a user deleted an asset from their Net Worth, the backend successfully deleted it, but the React frontend crashed silently, requiring a manual page refresh to show the update.
*Solution:* I traced the bug to the `finguardApi.js` fetch wrapper. The backend was returning an empty response body on successful deletion. The frontend `res.json()` parser was trying to parse empty text and failing. I rewrote the frontend parser to check for `res.status === 204` or an empty body, gracefully falling back, which enabled instant, real-time UI reloading!

**2. Tesseract.js OCR Inaccuracies**
*Challenge:* The receipt scanner was picking up random symbols from store logos and grabbing the wrong numbers (like Tax amounts instead of the Grand Total).
*Solution:* I couldn't just rely on raw AI. I built a custom JavaScript Regex engine (`receiptOcr.js`) that strips non-alphanumeric noise from the start of lines and strictly enforces keyword boundaries for the word "Total", bringing the accuracy closer to 98%.

**3. Making the AI Copilot Dynamic**
*Challenge:* Simulating a smart AI chat without an expensive OpenAI API key.
*Solution:* I built a custom heuristic rule engine (`aiChatEngine.js`). I mapped over 20 different user intents and 50+ phrase triggers. The hardest part was feeding the live React Redux-style `dashboardData` directly into the chat logic so the AI could perform real-time math (like dividing Total Assets by Monthly Expenses to tell the user their exact "Runway Months").

---

## 4. Potential Examiner Questions (Q&A)

**Q1: Why did you choose Java Spring Boot instead of Node.js for the backend?**
**Answer:** Because financial applications require strict data integrity and type safety. Java's strongly typed nature, combined with Spring Boot's built-in transaction management (`@Transactional`) and Spring Security, made it the most robust choice for handling sensitive money calculations.

**Q2: How is the FSI different from a regular credit score?**
**Answer:** A credit score only cares about your ability to pay back debt. Our FSI (Financial Stability Index) is designed for *variable income* earners. It cares about cash flow volatility, emergency runway, and savings rates—metrics that actually define daily financial peace of mind for freelancers.

**Q3: How does your app maintain security?**
**Answer:** The app uses stateless JWT (JSON Web Tokens). No session data is stored on the server. Passwords are never stored in plain text; they would typically be hashed using BCrypt. Furthermore, the REST APIs are secured via Spring Security filter chains, ensuring endpoints cannot be accessed without a valid Bearer token.

**Q4: If you had more time, what would you add?**
**Answer:** I would integrate a real Open Banking API (like Plaid) to pull bank transactions automatically instead of relying entirely on manual entry and OCR receipt scanning. I would also hook the AI Copilot up to a real LLM (like Gemini) to provide completely generative, free-flowing financial advice based on the user's data context.
