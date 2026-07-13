# Seeded Test Logins — FinGuard API 🛡️

Here is a list of all pre-seeded worker profiles you can use to test the platform.

### 🔑 Common Password (All Users)
```text
password123
```

---

### 👥 Seeding Personas & Credentials

| Username | Full Name | Profession / Persona | Primary Focus |
| :--- | :--- | :--- | :--- |
| **`demo`** | John Doe | Freelance Designer & Gig Worker | Digital UI/UX contracts & retainer billing |
| **`rajesh_k`** | Rajesh Kumar | Construction Worker - Daily Wages | Volatile daily cash wage flow |
| **`priya_s`** | Priya Sharma | Delivery Driver - Uber/Ola | Daily gig delivery payouts & fuel expenses |

---

### 💻 Local URLs
* **Frontend UI Dashboard**: [http://localhost:5175/](http://localhost:5175/)
* **Backend API Swagger**: [http://localhost:9080/swagger-ui.html](http://localhost:9080/swagger-ui.html)
* **H2 Database Console**: [http://localhost:9080/h2-console](http://localhost:9080/h2-console)
  * *JDBC URL*: `jdbc:h2:mem:finguarddb`
  * *User Name*: `sa`
  * *Password*: `password`

### 🧾 Seeded Auto Round-Up Note
All seeded demo users are configured with `autoRoundUpEnabled = true` and a round-up bucket threshold setting. The new bucket behavior preserves funds when no active savings goals exist and applies round-up contributions only when goals are available.
