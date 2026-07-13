# FinGuard API Lab Explanation

Sir, I am explaining the project in simple words. I am talking like a student telling a teacher how the app works.

## 1. What this project is about

FinGuard is a personal finance app. It helps people manage:
- income
- expenses
- savings goals
- net worth
- financial stability
- suspicious spending alerts
- advisor suggestions

The backend is built with Java and Spring Boot. The frontend is built with React.

## 2. How the app works

The app has these main parts:
- login and security
- dashboard summary
- income tracking
- expense tracking
- stability score
- forecast prediction
- auto round-up savings bucket
- advisor chat
- sample data for demo users

I will explain each part in easy language.

## 3. Login and security

This is in `backend/src/main/java/com/finguard/api/service/AuthService.java` and `AuthController.java`.

How it works:
- The user types username and password.
- The backend checks the credentials.
- If correct, it gives a JWT token.
- The frontend sends that token with every request.

Why it is important:
- The API only allows requests with the token.
- This keeps user data protected.

## 4. Dashboard summary

This is in `backend/src/main/java/com/finguard/api/service/DashboardService.java`.

How it works:
- It collects income, expenses, alerts, and notifications.
- It computes total income, total expense, and balance.
- It asks the stability service for score and forecast.
- It sends all this data to the frontend.

Why it is useful:
- It shows the main money picture in one page.
- The user can see the summary clearly.

## 5. Income tracking

This is in `backend/src/main/java/com/finguard/api/service/IncomeService.java` and `IncomeController.java`.

How it works:
- The user adds an income record.
- The backend saves it in the database.
- It updates the total income and budget data.
- It can also start the round-up savings bucket if enabled.

Why it is useful:
- It keeps the income history updated.
- It helps the app calculate cash flow.

## 6. Expense tracking

This is in `backend/src/main/java/com/finguard/api/service/ExpenseService.java` and `ExpenseController.java`.

How it works:
- The user adds an expense.
- The backend saves the expense data.
- It checks if the expense looks suspicious.
- It updates the balance and stability score.

Why it is useful:
- It tracks spending and shows alerts.
- It helps the user find strange or large transactions.

## 7. Stability score

This is in `backend/src/main/java/com/finguard/api/service/StabilityService.java`.

How it works:
- It takes the last 9 months of income and expense data.
- It calculates average income and average expense.
- It measures income volatility (how much income changes).
- It checks debt and savings goal progress.
- It combines everything into a stability score.

Why it is useful:
- The score tells the user how safe their finances are.
- It is easier to understand than many separate numbers.

Simple idea:
- If income is steady, the score is better.
- If spending is too high, the score is worse.
- If debt is large, the score is worse.
- If savings goals are far, the score is worse.

## 8. Forecast prediction

This is in `backend/src/main/java/com/finguard/api/service/ForecastService.java`.

How it works:
- It predicts future income and expense.
- It uses two methods and averages them:
  - linear regression
  - Holt smoothing

Why it is useful:
- It gives the user an estimate for next months.
- It keeps recent ups and downs in the data.

If there is not enough data, it uses a simple average.

## 9. Auto round-up savings bucket

This is a new feature in the app.

How it works:
- The user can turn on auto round-up savings.
- The app uses a configured threshold.
- When income comes in, part of it goes to the bucket.
- The bucket holds the money until there is an active savings goal.
- If no active goal exists, it keeps the money as reserve.

Why it is useful:
- It helps the user save automatically.
- It avoids sending money to goals when no goal is active.

## 10. Advisor chat

This is in `backend/src/main/java/com/finguard/api/service/AiAdvisorService.java`.

How it works:
- The user sends a message to the advisor.
- The app can use OpenAI, Gemini, Ollama, or algorithmic mode.
- If external AI is not available, it uses a local rule-based advisor.
- It checks the message for words like save, invest, budget, stability, or anomaly.
- It builds an answer using the user’s finance data.

Why it is useful:
- It gives advice quickly.
- It works even when external AI is not set up.

## 11. Seed demo users

This is in `backend/src/main/java/com/finguard/api/config/DataInitializer.java`.

How it works:
- When the app starts, it creates demo user data.
- It fills income, expenses, assets, liabilities, and goals.
- It also sets auto round-up and threshold settings.

Why it is useful:
- The app is ready to use immediately.
- It is good for testing and demo.

## 12. Frontend notes

The frontend is in `frontend/src/App.jsx` and the locale files.

How it works:
- It shows the dashboard, charts, and profile.
- It sends requests to the backend for login and data.
- It shows alerts and savings controls.
- It uses `savings.title` for the savings section label.

Why it is useful:
- It makes the app interactive and user-friendly.
- It shows results in the browser.

## 13. Why this is good for exam

This project is a good lab project because:
- it has backend API logic and frontend UI
- it uses JWT authentication
- it has finance and score calculations
- it has prediction and savings features
- it has AI advisor fallback
- it has seed data ready to use

## 14. Simple formulas

Important formulas:
- `balance = total income - total expense`
- `net worth = total assets - total liabilities`
- `burn rate = average expense / average income`
- `volatility = how much income changes each month`
- `stability score = a mix of spending, income changes, debt, and savings progress`
- `forecast = average of two prediction methods`

That is the project story in simple words, sir.

If you want, I can also make a shorter version with only the main points for exam notes.
