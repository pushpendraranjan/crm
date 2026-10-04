# CRM / Lead Management System

A production-grade, full-stack Mini CRM and Lead Management System built for real estate sales teams to capture, assign, filter, track, and follow up on client leads through an intuitive, responsive dashboard.

---

## 📑 Table of Contents
1. [Tech Stack](#-tech-stack)
2. [Architecture Overview](#-architecture-overview)
3. [Database Schema & Relationships](#-database-schema--relationships)
4. [Project Structure](#-project-structure)
5. [Quick Start & Local Setup](#-quick-start--local-setup)
6. [Environment Variables](#-environment-variables)
7. [API Documentation](#-api-documentation)
8. [Authentication Flow](#-authentication-flow)
9. [Frontend Overview](#-frontend-overview)
10. [Deployment Guide](#-deployment-guide)
11. [Seeded Accounts](#-seeded-accounts)

---

## 🛠 Tech Stack

- **Backend**: Node.js + Express.js (REST API architecture)
- **Database**: PostgreSQL
- **ORM**: Prisma (clean type-safe queries, migrations, seed scripts)
- **Authentication**: JWT (JSON Web Tokens) with `Bearer` header authorization
- **Password Hashing**: bcryptjs (salt rounds: 10)
- **Validation**: express-validator (centralized request validation)
- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS (fully responsive, modern UI design)
- **Data Fetching / State**: TanStack React Query v5 (automatic caching, background re-validation)
- **Visualizations**: Recharts (Pie Chart and Bar Chart for pipeline distribution)
- **Icons & Notifications**: Lucide React + react-hot-toast

---

## 🏛 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                 React + Vite + TypeScript UI                │
│    (Dashboard, Leads Table, Lead Details, Auth Pages)       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON (JWT Bearer Token)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express.js REST API Server                │
│  ┌───────────────┬─────────────────┬──────────────────────┐ │
│  │  Auth Router  │  Leads Router   │  FollowUps Router    │ │
│  └───────┬───────┴────────┬────────┴──────────┬───────────┘ │
│          │                │                   │             │
│          ▼                ▼                   ▼             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │     Middleware: JWT Guard, Validators, Error Handler   │ │
│  └────────────────────────┬───────────────────────────────┘ │
│                           │                                 │
│                           ▼                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Prisma ORM Client                   │ │
│  └────────────────────────┬───────────────────────────────┘ │
└───────────────────────────┼─────────────────────────────────┘
                            │ SQL Queries
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database Engine                 │
│         (Users Table, Leads Table, FollowUps Table)         │
└─────────────────────────────────────────────────────────────┘
```

### Explaining the Architecture in a Live Code Review:
> *"The backend uses a layered Express architecture: routing, validation middleware, and controllers querying PostgreSQL via Prisma ORM. There are no redundant model files because Prisma generates a strictly typed client directly from `schema.prisma`. Authentication is completely stateless using signed JWTs. On the frontend, React with TypeScript and TanStack Query handles server-state caching, eliminating redundant network calls, while Tailwind CSS provides responsive utility styling."*

---

## 🗄 Database Schema & Relationships

### The Entity Relationship: `User 1 ──< many Leads 1 ──< many FollowUps`

```
┌──────────────────┐          ┌───────────────────────┐          ┌─────────────────────┐
│      User        │          │         Lead          │          │      FollowUp       │
├──────────────────┤          ├───────────────────────┤          ├─────────────────────┤
│ id (PK, cuid)    │1        *│ id (PK, cuid)         │1        *│ id (PK, cuid)       │
│ name             ├──────────┤ name                  ├──────────┤ leadId (FK -> Lead) │
│ email (Unique)   │ assigned │ phone, email          │ has many │ title               │
│ password (Hash)  │          │ budget, location      │          │ date                │
│ role (ADMIN/     │          │ propertyType          │          │ status (Pending/    │
│       AGENT)     │          │ dealType (Buy/Rent/   │          │         Done/       │
│ createdAt        │          │           Sell)       │          │         Cancelled)  │
└──────────────────┘          │ leadSource            │          │ notes               │
                              │ status (New/Contacted/│          │ createdAt           │
                              │   Followup/Converted/ │          └─────────────────────┘
                              │   Lost)               │
                              │ assignedToId (FK)     │
                              │ followupDate, notes   │
                              │ createdAt             │
                              └───────────────────────┘
```

- **User**: Represents sales agents or system administrators. An admin or agent can have many assigned leads (`User 1 → many Leads`).
- **Lead**: Core business record with comprehensive property details (`budget`, `location`, `propertyType`, `dealType`), status workflow (`New` → `Contacted` → `Followup` → `Converted` / `Lost`), and assignment to a User.
- **FollowUp**: Scheduled touchpoint with date and status (`Pending`, `Done`, `Cancelled`) tied directly to a lead (`Lead 1 → many FollowUps`). On delete of a Lead, associated follow-ups cascade delete cleanly.
- **Indexes**: Applied to foreign keys and high-frequency search fields (`Lead.status`, `Lead.location`, `Lead.assignedToId`, `Lead.createdAt`, `FollowUp.date`).

---

## 📁 Project Structure

```
crmDL/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma       # Prisma models, enums & relations
│   │   └── seed.js             # Seed database with sample data
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js           # Singleton Prisma client instance
│   │   ├── controllers/
│   │   │   ├── authController.js     # Register, Login, Me
│   │   │   ├── userController.js     # Users list for lead assignment
│   │   │   ├── leadController.js     # CRUD, pagination, filtering, stats
│   │   │   └── followUpController.js # Schedule, update, delete follow-ups
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT verification & role authorization
│   │   │   ├── errorHandler.js # Centralized Prisma & HTTP error handler
│   │   │   └── validate.js     # Express-validator error wrapper
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── leadRoutes.js
│   │   │   └── followUpRoutes.js
│   │   └── server.js           # Express app setup & CORS configuration
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── test-api.js             # Automated 20-point end-to-end API test suite
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx      # Responsive sidebar navigation & shell
│   │   │   ├── LeadForm.tsx    # Reusable create/edit form with validation
│   │   │   └── StatusBadge.tsx # Semantic color-coded status badges
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx # JWT token & user state management
│   │   ├── lib/
│   │   │   └── api.ts          # Axios client with interceptors & auto-auth
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── DashboardPage.tsx   # Stat cards, Pie & Bar charts, follow-ups
│   │   │   ├── LeadsPage.tsx       # Paginated table, search & all 4 filters
│   │   │   ├── AddLeadPage.tsx     # Create new lead
│   │   │   ├── EditLeadPage.tsx    # Edit existing lead
│   │   │   └── LeadDetailPage.tsx  # Full lead overview & follow-up scheduler
│   │   ├── types/
│   │   │   └── index.ts        # TypeScript interfaces and types
│   │   ├── App.tsx             # Protected & public routing
│   │   ├── index.css           # Tailwind base styles
│   │   └── main.tsx            # App bootstrap with QueryClientProvider
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vercel.json             # SPA routing for Vercel deployment
│   └── vite.config.ts
├── docker-compose.yml          # Containerized PostgreSQL & backend services
├── render.yaml                 # One-click Render.com blueprint deployment
└── README.md
```

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- Node.js (v18 or higher)
- Docker Desktop (for containerized PostgreSQL) or local PostgreSQL instance

### Step 1: Clone and Start Database with Docker

```bash
# Set the required variables from the root .env.example in an ignored root .env file.
# Start PostgreSQL container on port 5433 (to avoid conflicts with existing native Postgres)
docker compose up -d postgres
```

### Step 2: Setup and Run the Backend

```bash
cd backend

# Install dependencies
npm install

# Run Prisma migrations to create tables
npx prisma migrate dev --name init

# Seed initial users and sample leads
npm run prisma:seed

# Start backend development server (runs on port 5000)
npm run dev
# or: node src/server.js
```

### Step 3: Run the Automated API Test Suite

```bash
cd backend
node test-api.js
# Output: 20 passed, 0 failed out of 20
```

### Step 4: Setup and Run the Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Start Vite dev server (runs on port 5173)
npm run dev
```

Visit **http://localhost:5173** in your browser.

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Configure locally |
| `JWT_SECRET` | Secret key for signing JWT tokens | Configure locally |
| `JWT_EXPIRES_IN` | Token lifespan | Configure locally |
| `PORT` | Backend server port | Configure locally |
| `NODE_ENV` | Environment mode | Configure locally |
| `CLIENT_URL` | Allowed frontend origin(s) for CORS | Configure locally |
| `SEED_ADMIN_EMAIL` | Email for the seeded admin account | Configure locally |
| `SEED_ADMIN_PASSWORD` | Password for the seeded admin account | Configure locally |
| `SEED_AGENT_EMAIL` | Email for the seeded agent account | Configure locally |
| `SEED_AGENT_PASSWORD` | Password for the seeded agent account | Configure locally |

Set these values in the ignored local `backend/.env` file before running the seed script. The `.env.example` file lists variable names only.

### Frontend (`frontend/.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Base URL for backend REST API | Configure locally |

---

## 📡 API Documentation

### 1. Authentication
- `POST /api/auth/register` — Register a new agent or admin
  - Body: `{ name, email, password, role }`
- `POST /api/auth/login` — Sign in and receive JWT token
  - Body: `{ email, password }`
- `GET /api/auth/me` *(Protected)* — Returns authenticated user details

### 2. Users
- `GET /api/users` *(Protected)* — Returns all users for lead assignment dropdowns

### 3. Leads
- `GET /api/leads/dashboard` *(Protected)* — Returns metrics:
  - `total`: Total leads count
  - `newLeads`: New leads count
  - `followupsToday`: Count of pending follow-ups scheduled for today
  - `converted`: Converted leads count
  - `lost`: Lost leads count
  - `conversionRate`: Percentage of converted leads
  - `statusBreakdown`: Distribution array for charts
  - `recentLeads`: 5 most recently created leads
  - `upcomingFollowUps`: 5 next upcoming pending follow-ups
- `GET /api/leads` *(Protected)* — Paginated, searchable, filterable list
  - Query parameters:
    - `page` (default 1), `limit` (default 10)
    - `search`: Search query matching name, email, or phone
    - `status`: Filter by `New`, `Contacted`, `Followup`, `Converted`, `Lost`
    - `location`: Case-insensitive substring match
    - `propertyType`: Case-insensitive substring match
    - `assignedToId`: Filter by assigned agent ID
    - `sortBy`: `createdAt`, `name`, `status`, `budget`, `followupDate`
    - `sortOrder`: `asc` or `desc`
- `POST /api/leads` *(Protected)* — Create a new lead record
- `GET /api/leads/:id` *(Protected)* — Retrieve lead details with assigned agent and follow-ups
- `PUT /api/leads/:id` *(Protected)* — Update lead fields
- `DELETE /api/leads/:id` *(Protected)* — Delete lead and cascade delete its follow-ups

### 4. Follow-Ups
- `GET /api/followups` *(Protected)* — List all follow-ups (supports `status` and `upcoming=true` filters)
- `GET /api/followups/lead/:leadId` *(Protected)* — List follow-ups for a specific lead
- `POST /api/followups/lead/:leadId` *(Protected)* — Schedule a new follow-up for a lead
- `PUT /api/followups/:id` *(Protected)* — Update follow-up status (`Pending`, `Done`, `Cancelled`)
- `DELETE /api/followups/:id` *(Protected)* — Delete a follow-up

---

## 🔒 Authentication Flow

1. **User Login**: User submits credentials to `POST /api/auth/login`.
2. **Password Verification**: Backend compares plaintext password against bcrypt hash in database.
3. **Token Generation**: On success, backend signs a JWT with user ID and sends it back with user profile.
4. **Token Storage**: Frontend stores JWT in browser `localStorage`.
5. **Request Interceptor**: Axios interceptor automatically attaches `Authorization: Bearer <token>` to all subsequent requests.
6. **Token Verification**: Backend `protect` middleware verifies JWT on protected endpoints and loads `req.user`.
7. **Session Expiry**: If a `401 Unauthorized` response is received, the interceptor clears local storage and redirects the user to `/login`.

---

## 💻 Frontend Overview

### Pages Implemented:
1. **Login Page (`/login`)**: Login form with validation and error banners.
2. **Registration Page (`/register`)**: Register name, email, password, and role selection.
3. **Dashboard (`/dashboard`)**:
   - 6 KPI stat cards (Total, New, Follow-ups Today, Converted, Lost, Conversion Rate)
   - Interactive Recharts Pie Chart & Bar Chart of status distribution
   - Recent leads table and upcoming follow-ups list with direct links
4. **Lead Listing (`/leads`)**:
   - Real-time search across Name, Phone, and Email
   - Multi-attribute filtering (Status, Assigned Agent, Location, Property Type)
   - Column sorting by Name, Status, and Date
   - Pagination controls with total record and page counters
   - Quick action buttons (View, Edit, Delete with confirmation modal)
5. **Add Lead (`/leads/new`)**: Full-featured form with validation for all 12 lead properties.
6. **Edit Lead (`/leads/:id/edit`)**: Pre-populated form for updating lead records.
7. **Lead Details (`/leads/:id`)**:
   - Comprehensive contact and property cards
   - Embedded Follow-up scheduling form with instant refresh
   - Follow-up timeline with one-click "Mark Done" toggle

---

## ☁️ Deployment Guide

### Option 1: Render.com (Recommended - Full Stack + Postgres Blueprint)
This repository includes a `render.yaml` blueprint that deploys the entire stack automatically:
1. Push this repository to GitHub.
2. Log into [Render.com](https://render.com) and click **New +** → **Blueprint**.
3. Connect your repository.
4. Render will automatically provision:
   - Hosted PostgreSQL database (`crm-postgres-db`)
   - Backend web service (`crm-backend`) running Prisma migrations & seeds
   - Frontend static site (`crm-frontend`) with SPA rewrites

### Option 2: Hosted Database (Neon / Supabase) + Vercel / Railway
1. **Database**: Create a free PostgreSQL database on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com). Copy the connection URI.
2. **Backend (Render / Railway / Fly.io)**:
   - Environment variables:
     - `DATABASE_URL`: Your hosted PostgreSQL URI
     - `JWT_SECRET`: Random 32+ character string
     - `CLIENT_URL`: Your deployed frontend URL
     - `NODE_ENV`: `production`
   - Build Command: `npm install && npx prisma generate && npx prisma migrate deploy && npm run prisma:seed`
   - Start Command: `node src/server.js`
3. **Frontend (Vercel / Netlify / Render)**:
   - Root directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment variable: `VITE_API_URL=https://your-backend-domain.com/api`

---

## 👤 Seeded Accounts

The seed script creates an admin account, an agent account, and sample leads. Provide the four `SEED_*` variables in the ignored local `backend/.env` file before running the seed script. The seed script exits with a clear error if any required variable is missing.
