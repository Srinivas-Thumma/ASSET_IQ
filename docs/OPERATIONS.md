# AssetOwl Operations & Environment Guide

## 1. Dual-Environment Architecture

AssetOwl enforces strict physical isolation between Development and Production environments:

```
┌─────────────────────────────────────────────────────────────┐
│                 ENVIRONMENT ISOLATION MATRIX                │
├─────────────────────┬───────────────────┬───────────────────┤
│ Config Property     │ Development       │ Production        │
├─────────────────────┼───────────────────┼───────────────────┤
│ NODE_ENV            │ `development`     │ `production`      │
│ Configuration File  │ `.env.development`│ `.env.production` │
│ MongoDB Database    │ `assetowl_dev`    │ `assetowl`        │
│ Backend Port        │ `5000`            │ `5000` (or $PORT) │
│ Frontend Host       │ `localhost:5173`  │ Configured Domain │
│ Dev Seed Allowed    │ ✅ YES            │ ❌ STRICTLY BLOCKED│
│ Public Org Register │ ✅ Open test org  │ ❌ Org Code Only  │
│ Cookie SameSite     │ `lax`             │ `strict`          │
│ Cookie Secure Flag  │ `false` (HTTP ok) │ `true` (HTTPS)    │
└─────────────────────┴───────────────────┴───────────────────┘
```

---

## 2. Environment Configuration Loading

In [`backend/src/config/env.js`](file:///c:/Projects/assetIQ-v2/backend/src/config/env.js), the backend dynamically loads the appropriate `.env` file based on the runtime `NODE_ENV`:

```javascript
dotenv.config({
  path: path.resolve(__dirname, `../../.env.${process.env.NODE_ENV || 'development'}`),
  quiet: true
});
```

### Essential Environment Variables

```bash
# Server & Database
PORT=5000
NODE_ENV=development # or production
MONGODB_URI=mongodb://localhost:27017/assetowl_dev

# Authentication Secrets (Must be distinct in production)
JWT_SECRET=strong-random-access-secret
JWT_EXPIRE=15m
REFRESH_TOKEN_SECRET=different-strong-refresh-secret
REFRESH_TOKEN_EXPIRE=7d

# CORS & Client
CORS_ORIGIN=http://localhost:5173

# AI Diagnostic Engine
OLLAMA_BASE_URL=http://127.0.0.1:11434
```

---

## 3. Seed & Reset System

### Development Seed Scripts
- `npm run seed:dev` (runs `backend/src/seed/development.seed.js`): Populates the development database with rich demo data across 2 organizations:
  1. **TechFlow Solutions** (`techflow-solutions`): 12 assets, 8 employees, active tickets, warranties, and locations.
  2. **GreenLeaf Corp** (`greenleaf-corp`): 6 assets, 4 employees, and maintenance tickets.
- `npm run reset:dev` (runs `backend/src/seed/reset-dev.seed.js`): Drops all collections in `assetowl_dev` and runs a clean seed.
- `npm run seed:superadmin`: Provisions the root platform administrator (`superadmin@assetowl.dev` / `SuperAdmin123!`).

### Seed Safety Guard ([`development.seed.js`](file:///c:/Projects/assetIQ-v2/backend/src/seed/development.seed.js))
To guarantee that production data is never corrupted:
```javascript
if (process.env.NODE_ENV === 'production' || mongoose.connection.name === 'assetowl') {
  console.error('FATAL: Development seed script cannot run in production or against assetowl database!');
  process.exit(1);
}
```

---

## 4. Structured Logging & Redaction

### Winston Logging Framework ([`backend/src/config/logger.js`](file:///c:/Projects/assetIQ-v2/backend/src/config/logger.js))
- **Correlation ID Injection**: Automatically formats log messages with `[req.id]` for distributed tracing.
- **Sensitive Data Masking**: Intercepts log streams and redacts sensitive keys:
  ```javascript
  const SENSITIVE_KEYS = ['password', 'passwordHash', 'token', 'secret', 'authorization', 'cookie'];
  ```
- **Log Levels**:
  - `info`: Application lifecycle events, database connections, and WebSocket handshakes.
  - `warn`: Cross-tenant security blocks, authentication rejections, and rate-limit triggers.
  - `error`: Uncaught exceptions, database query failures, and AI inference timeouts.

---

## 5. Health Checks & Observability

### Endpoint: `GET /api/health`
- **Controller**: [`app.js:46-62`](file:///c:/Projects/assetIQ-v2/backend/src/app.js#L46-L62)
- **Logic**: Inspects `mongoose.connection.readyState === 1`.
- **Response**:
  - `200 OK`: `{ success: true, data: { status: "healthy", database: "connected", timestamp: "..." } }`
  - `503 Service Unavailable`: If database connection is dropped.

---

## 6. Deployment & Future Infrastructure

### Current State
- Monolith running via Node.js ESM (`node src/server.js`) behind Vite dev proxy or standard reverse proxy.

### Planned Production Hardening (Sprint 5)
- Multi-stage Docker containerization (`Dockerfile` for Node.js 20 Alpine backend and Nginx Alpine frontend).
- `docker-compose.yml` for local orchestration with MongoDB.
- Graceful shutdown handlers in `server.js` (`SIGTERM`/`SIGINT` closing HTTP connections and `mongoose.connection.close()`).
