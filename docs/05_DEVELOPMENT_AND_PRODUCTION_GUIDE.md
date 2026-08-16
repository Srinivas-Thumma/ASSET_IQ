# 05 — Development and Production Guide

## 1. Environment Commands & Scripts

All commands use `cross-env` to provide consistent cross-platform execution on Windows, macOS, and Linux.

### Backend Commands (from `backend/` directory)

```bash
# Start backend in Development mode (watches for file changes, connects to assetowl_dev)
npm run dev

# Start backend in Production mode (connects to assetowl)
npm start

# Seed rich development data into assetowl_dev (idempotent, safe to run repeatedly)
npm run seed:dev

# Reset entire assetowl_dev database and reseed freshly
npm run reset:dev

# Seed Global Super Admin
npm run seed:superadmin
```

### Frontend Commands (from `frontend/` directory)

```bash
# Start local Vite development dev server (connects to http://localhost:5000/api)
npm run dev

# Build production bundle into frontend/dist/ (configured with production API base URL)
npm run build
```

---

## 2. Environment Configuration Reference

### Backend `.env.development`
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/assetowl_dev
JWT_SECRET=dev_jwt_access_secret_key_assetowl_2026_dev
JWT_EXPIRE=15m
REFRESH_TOKEN_SECRET=dev_jwt_refresh_secret_key_assetowl_2026_dev_different
REFRESH_TOKEN_EXPIRE=7d
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
SUPERADMIN_EMAIL=superadmin@assetowl.dev
SUPERADMIN_PASSWORD=SuperAdmin123!
```

### Backend `.env.production`
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/assetowl
JWT_SECRET=7f63d038477dbeee5101c21629c04d82019c0ad2459e1db7071064c710c7fd5f
JWT_EXPIRE=15m
REFRESH_TOKEN_SECRET=40ec053b3917bf1531b692b8ab9d0673a97c32211d37d1ed7bb9d8dcbdc57111
REFRESH_TOKEN_EXPIRE=7d
NODE_ENV=production
CORS_ORIGIN=https://your-deployed-frontend.com
SUPERADMIN_EMAIL=superadmin@assetowl.com
SUPERADMIN_PASSWORD=SuperAdmin123!
```

---

## 3. Development Test Accounts & Roles

All demo user accounts are seeded with the password: `password123`.

### 🏢 TechFlow Solutions (`techflow-solutions`)
| Role | Email | Password | Department | Assigned Employee |
|---|---|---|---|---|
| **Org Admin** | `admin@techflow.dev` | `password123` | Engineering | Priya Sharma |
| **Asset Manager** | `manager@techflow.dev` | `password123` | IT | Ravi Patel |
| **Employee** | `alice@techflow.dev` | `password123` | Engineering | Alice Chen |
| **Employee** | `bob@techflow.dev` | `password123` | Marketing | Bob Williams |
| **Employee** | `clara@techflow.dev` | `password123` | Finance | Clara Vance |
| **Employee** | `daniel@techflow.dev` | `password123` | IT | Daniel Craig |
| **Employee** | `elena@techflow.dev` | `password123` | HR | Elena Rostova |
| **Employee** | `frank@techflow.dev` | `password123` | Engineering | Frank Wright |
| **Employee** | `grace@techflow.dev` | `password123` | IT | Grace Hopper |
| **Employee** | `henry@techflow.dev` | `password123` | Operations | Henry Ford |
| **Employee** | `isabel@techflow.dev` | `password123` | Finance | Isabel Diaz |

### 🏢 GreenLeaf Corp (`greenleaf-corp`)
| Role | Email | Password | Department | Assigned Employee |
|---|---|---|---|---|
| **Org Admin** | `admin@greenleaf.dev` | `password123` | Sales | David Kumar |
| **Asset Manager** | `manager@greenleaf.dev` | `password123` | IT | Eva Rodriguez |
| **Employee** | `carol@greenleaf.dev` | `password123` | Sales | Carol Thompson |
| **Employee** | `george@greenleaf.dev` | `password123` | HR | George Miller |
| **Employee** | `hannah@greenleaf.dev` | `password123` | Finance | Hannah Abbott |
| **Employee** | `ian@greenleaf.dev` | `password123` | Operations | Ian Malcolm |
| **Employee** | `julia@greenleaf.dev` | `password123` | Sales | Julia Roberts |
| **Employee** | `kevin@greenleaf.dev` | `password123` | IT | Kevin Bacon |

### 👑 Global Platform Super Admin
| Role | Email | Password | Scope |
|---|---|---|---|
| **Super Admin** | `superadmin@assetowl.dev` | `SuperAdmin123!` | Global (`organizationId: null`) |

---

## 4. Rich Dataset Summary (`assetowl_dev`)

```
TechFlow Solutions:
  Users:                11
  Employees:            11
  Assets:               39
  Categories:           10
  Vendors:              7
  Locations:            15
  Tickets:              12
  Assignments:          16
  Warranties:           14

GreenLeaf Corp:
  Users:                8
  Employees:            8
  Assets:               25
  Categories:           7
  Vendors:              6
  Locations:            9
  Tickets:              8
  Assignments:          10
  Warranties:           9

Total Assets:           64
Total Tickets:          20
Total Assignments:      26
Total Warranties:       23
```

---

## 5. Production Safety Rules

1. **`development.seed.js`** contains hardcoded checks:
   ```javascript
   if (NODE_ENV !== 'development') process.exit(1);
   if (!dbName.includes('dev') || dbName === 'assetowl') process.exit(1);
   ```
2. **`reset-dev.seed.js`** contains identical guards to strictly prevent accidental data wipes on `assetowl`.
3. **`.gitignore`** protects all `.env*` files from being committed to source control.
