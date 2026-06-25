# SmartSpend — Personal Finance Tracker

A full-stack personal finance tracker built with **React + Vite + Tailwind CSS** (frontend) and **Flask + MySQL** (backend).

---

## Project Structure

```
smartspend/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # App factory, extensions
│   │   ├── config.py            # Config classes (dev/prod)
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── auth/routes.py       # Register, login, JWT refresh
│   │   ├── expenses/routes.py   # CRUD + categories + summary
│   │   ├── income/routes.py     # CRUD + sources + summary
│   │   ├── budgets/routes.py    # CRUD + spending calculation
│   │   ├── settings/routes.py   # Profile, preferences, password
│   │   └── common/utils.py      # Shared helpers
│   ├── run.py                   # Flask entry point
│   ├── requirements.txt
│   ├── database.sql             # Schema (run in phpMyAdmin)
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/               # Dashboard, Expenses, Income, Budgets, Settings
    │   ├── components/          # Layout, Modal
    │   ├── utils/               # api.js, AuthContext.jsx, format.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **XAMPP** (Apache + MySQL) running on port 3306

---

## Backend Setup

### 1. Create the database

1. Start XAMPP — make sure **MySQL** is running.
2. Open **phpMyAdmin** → `http://localhost/phpmyadmin`
3. Click **New** → create database `smartspend_db` (utf8mb4_unicode_ci).
4. Select `smartspend_db` → **SQL** tab → paste contents of `backend/database.sql` → **Go**.

### 2. Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` if your MySQL password is not empty:

```
MYSQL_PASSWORD=your_password_here
```

### 3. Install dependencies & run

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt

# Initialise Flask-Migrate (first time only)
flask --app run db init
flask --app run db migrate -m "initial"
flask --app run db upgrade

# Start the API server
python run.py
```

API runs at **http://localhost:5000**

> **Tip:** If you skip migrations, run `flask --app run init-db` to create tables directly.

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App runs at **http://localhost:3000** (proxies `/api` → Flask on port 5000).

---

## Features

| Area | Details |
|---|---|
| **Auth** | JWT register / login / refresh / logout |
| **Dashboard** | Balance, income, expense stats; category breakdown; recent transactions; budget progress |
| **Expenses** | Add / edit / delete; filter by category, date, search; pagination |
| **Income** | Add / edit / delete; sources; filter; monthly summary |
| **Budgets** | Create / edit / delete; live spending calculation; on-track / at-risk / over status |
| **Settings** | Profile edit; change password; currency, date format, timezone, theme preferences |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get JWT tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Current user |
| GET/POST | `/api/expenses/` | List / create expenses |
| PUT/DELETE | `/api/expenses/<id>` | Update / delete expense |
| GET | `/api/expenses/categories` | List categories |
| GET | `/api/expenses/summary` | Monthly totals by category |
| GET/POST | `/api/income/` | List / create income |
| PUT/DELETE | `/api/income/<id>` | Update / delete income |
| GET | `/api/income/sources` | List income sources |
| GET | `/api/income/summary` | Monthly totals by source |
| GET/POST | `/api/budgets/` | List / create budgets |
| PUT/DELETE | `/api/budgets/<id>` | Update / delete budget |
| GET | `/api/budgets/summary` | Budget + spending status |
| GET/PUT | `/api/settings/profile` | Get / update profile |
| PUT | `/api/settings/preferences` | Currency, theme, date format |
| POST | `/api/settings/change-password` | Change password |
| GET | `/api/settings/currencies` | Supported currencies |
