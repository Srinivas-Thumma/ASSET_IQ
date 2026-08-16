# 01 — AssetOwl Architecture Documentation

## 1. System Overview

**AssetOwl v2** is a multi-tenant enterprise IT Asset Management (ITAM) and Lifecycle Operations platform. It enables organizations to track hardware and software assets, assign devices to employees, manage lifecycle workflows (procurement, custody, repairs, warranty tracking, and retirement), handle maintenance tickets with real-time socket communication, and analyze asset health.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                 FRONTEND (React 19 + Vite 8)                              │
│  - Tailwind CSS v4       - Zustand (Auth Store)        - GSAP + Framer Motion Animations  │
│  - Lucide React Icons    - TanStack React Query v5     - Recharts Data Visualization      │
└────────────────────────────┬─────────────────────────────┬───────────────────────────────┘
                             │ HTTPS / REST (Cookies)      │ WSS / WebSocket (Cookies)
                             ▼                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                BACKEND (Node.js + Express 5)                             │
│  - Helmet & CORS Security       - HttpOnly JWT Auth Pipeline      - Socket.IO Real-time  │
│  - Winston Structured Logger    - Mongoose 9.x Multi-Tenant ODM   - RBAC Authorization   │
└────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                             │ MongoDB Driver
                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                   MONGODB DATABASE                                       │
│  - Development DB: assetowl_dev                          - Production DB: assetowl       │
│  - 16 Collections with Multi-Tenant Indexing             - Append-Only Audit Trail Logs  │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Dual Environment Setup

AssetOwl operates under two fully isolated environments with dedicated databases, configuration files, and secrets.

| Environment | Frontend URL | Backend URL | Database Name | Env Config File |
|---|---|---|---|---|
| **Development** | `http://localhost:5173` | `http://localhost:5000` | `assetowl_dev` | `backend/.env.development` / `frontend/.env.development` |
| **Production** | Configured Production Host | Production API Host | `assetowl` | `backend/.env.production` / `frontend/.env.production` |

### Environment Isolation Rules
1. **Zero Database Overlap**: Development uses `assetowl_dev`; Production strictly connects to `assetowl`.
2. **Distinct Cryptographic Secrets**: Access tokens and Refresh tokens use separate secrets per environment. Production secrets are high-entropy random keys.
3. **No Automatic Demo Seeding in Production**: Production startup executes only the bootstrap check for the global Super Admin. Demo tenant organizations, employees, and assets are restricted to `development.seed.js`.
4. **Hard Guards**: Seeding (`seed:dev`) and database resetting (`reset:dev`) hard-abort if `NODE_ENV !== "development"` or if the target database name does not contain `"dev"`.

---

## 3. Technology Stack

### Frontend Architecture
- **Framework**: React 19 (`react`, `react-dom`) bundled with Vite 8 (`@vitejs/plugin-react`).
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`, `tailwindcss`).
- **Client State**: Zustand (`useAuthStore`) for user profile metadata and session awareness.
- **Server State**: TanStack React Query v5 (`@tanstack/react-query`) for asynchronous cache management, background refetching, and query invalidation.
- **Animation System**:
  - **Framer Motion**: Page transitions, modal mounts, dialog entrances.
  - **GSAP**: Data-driven counter count-ups (`KpiCard`), staggered table row entrances (`gsap.fromTo`).
- **Routing**: React Router v7 (`react-router-dom`).
- **Real-Time Client**: Socket.IO Client v4 (`socket.io-client`).

### Backend Architecture
- **Runtime**: Node.js (ES Modules, `"type": "module"`).
- **Web Framework**: Express 5.x (`express`).
- **Database Engine**: MongoDB via Mongoose 9.x ODM.
- **Authentication**: JWT (`jsonwebtoken`) with `HttpOnly`, `SameSite` cookies and `bcryptjs` password hashing.
- **Security Middleware**: Helmet (`helmet`), CORS (`cors`), Cookie Parser (`cookie-parser`).
- **Real-Time Engine**: Socket.IO Server v4 (`socket.io`).
- **Logging**: Winston 3.x (`winston`) with timestamp formatting, colorized console output, and file transports.

---

## 4. Multi-Tenant Architecture & Roles

AssetOwl utilizes a **pooled database, row-level tenant isolation** model.

### Tenant Scoping Model
- Every business entity (Asset, Employee, Department, Category, Location, Vendor, Assignment, Ticket, Warranty, Notification, AuditLog) contains an indexed `organizationId` referencing the `Organization` document.
- Uniqueness constraints are compound-indexed with `organizationId` (e.g., `{ organizationId: 1, assetCode: 1 }`, `{ organizationId: 1, name: 1 }`).
- Queries and mutations in service controllers are scoped to `req.user.organizationId`.

### Role-Based Access Control (RBAC)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SUPER ADMIN (Platform)                          │
│  - organizationId: null (Global Scope)                                 │
│  - System analytics, organization provisioning, subscription plans     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┴────────────────────────────┐
       ▼                                                         ▼
┌───────────────────────────────┐         ┌───────────────────────────────┐
│     ORG ADMIN (Tenant)        │         │   ASSET MANAGER (Tenant)      │
│ - Manage Users & Employees    │         │ - Register & edit Assets      │
│ - Configure Depts & Locations │         │ - Manage Assignments/Custody  │
│ - View Org Audits & Reports   │         │ - Handle & resolve Tickets    │
└──────────────┬────────────────┘         └───────────────┬───────────────┘
               │                                          │
               └────────────────────┬─────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           EMPLOYEE (Tenant)                             │
│  - View assigned personal assets (`/my-assets`)                         │
│  - Submit support/repair/request tickets (`/tickets`)                   │
│  - Participate in ticket chat messages                                  │
└─────────────────────────────────────────────────────────────────────────┘
```
