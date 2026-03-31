# Triads Finance Management

Internal Finance Dashboard for Triads Digital Marketing.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS v4
- **Backend**: Node.js + Express
- **Database**: PostgreSQL

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally

### 1. Set up the Database

Make sure PostgreSQL is running. Create the database:

```sql
CREATE DATABASE triads_finance;
```

### 2. Configure the Backend

Edit `server/.env` with your PostgreSQL credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=triads_finance
DB_USER=postgres
DB_PASSWORD=your_password
```

### 3. Run Database Setup (one-time)

```bash
cd server
npm run setup
```

This creates all tables and sets up the admin user.

**Default Login:**

- Username: `admin`
- Password: `triads@123`

> ⚠️ Change the password in `server/.env` before running setup if you want a custom password.

### 4. Start the Backend

```bash
cd server
npm run dev
```

Server runs on: http://localhost:5000

### 5. Start the Frontend

```bash
cd client
npm run dev
```

App runs on: http://localhost:5173

---

## 📁 Project Structure

```
Triads Finance Management/
├── client/              # React frontend (Vite + Tailwind)
│   └── src/
│       ├── pages/       # Dashboard, Clients, Categories, Employees, Reports, Settings
│       ├── components/  # Sidebar, MonthSelector, Modal
│       ├── context/     # AuthContext, AppContext
│       └── utils/       # Currency formatting helpers
└── server/              # Node.js + Express backend
    ├── routes/          # All API route handlers
    ├── middleware/       # JWT auth middleware
    ├── db.js            # PostgreSQL pool
    ├── schema.sql       # Database schema
    └── setup.js         # One-time DB setup script
```

## 🔐 Login

Single-user login. No multi-role system needed.
Default credentials set via `server/.env`:

- **Username**: `admin`
- **Password**: `triads@123`
