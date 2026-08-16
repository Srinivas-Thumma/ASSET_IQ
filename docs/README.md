# AssetOwl — Developer Knowledge Base & Architecture Guide

Welcome to the comprehensive technical documentation for **AssetOwl**, a full-stack, enterprise-grade Multi-Tenant Asset Lifecycle Management and IT Service Desk platform.

This directory serves as the definitive source of truth for the AssetOwl architecture, data flows, security boundaries, and runtime operations.

---

## 1. What is AssetOwl?

AssetOwl is an end-to-end IT Asset Management (ITAM) and Service Desk system designed for multi-organization tenancy. It unifies physical hardware tracking, custodian assignments, lifecycle transitions (from procurement through depreciation to retirement), warranty tracking, IT support ticketing with real-time Socket.IO chat, automated return inspection workflows, and local LLM-assisted hardware health diagnostics via Ollama.

---

## 2. Problem Statement & Key Solutions

| Business Challenge | AssetOwl Solution |
|--------------------|-------------------|
| **Siloed Asset Inventories** | Centralized fleet registry scoped per tenant with QR code generation, location hierarchies (Branch → Building → Floor → Room), and department tagging. |
| **Untracked Hardware Custody** | Formal assignment lifecycle with non-repudiable audit logs, employee self-service return workflows, and manager inspection checklists. |
| **Fragmented Support Communication** | Bi-directional ticket management linked directly to physical assets, featuring real-time WebSocket messaging and internal staff notes. |
| **Warranty & Maintenance Blindspots** | Automated cron and manual milestone alerts (30/15/7/0 days before expiration) with bulk notification dispatch. |
| **Hardware Degradation & Failure Risks** | Local LLM (Ollama `qwen2.5:3b` / `llama3:8b`) and heuristic health scoring evaluating age, ticket frequency, and expected category lifespan. |
| **Multi-Tenant Security Concerns** | Complete tenant boundary isolation at the database, REST controller, WebSocket room, and JWT token layers. |

---

## 3. Technology Stack

### Backend Stack
- **Runtime & Framework**: Node.js (ESM) + Express 5
- **Database & ODM**: MongoDB 9 + Mongoose 9
- **Authentication**: JWT (JSON Web Tokens) with HttpOnly, SameSite cookies (15-minute access token, 7-day refresh token with database persistence)
- **Password Hashing**: `bcryptjs`
- **Validation**: Zod 4
- **Real-Time Communication**: Socket.IO 4
- **AI / Local LLM**: Ollama Local API (`qwen2.5:3b` / `llama3:8b`) with in-memory 15-minute cooldown cache and deterministic heuristic fallback
- **Logging & Tracing**: Winston 3 with log credential masking and `X-Request-Id` correlation tracking
- **Security & Rate Limiting**: Helmet, CORS with credential headers, and tiered `express-rate-limit`

### Frontend Stack
- **Framework & Build**: React 19 + Vite 8
- **Routing**: React Router v7 with route-level lazy loading (`React.lazy` + `Suspense`, 28 isolated chunks)
- **Data Fetching & Cache**: TanStack Query v5 with tiered stale times (5s live tickets, 30s asset cache, 5m GC)
- **State Management**: Zustand v5 (`auth.store.js`, `ui.store.js`)
- **Styling & Motion**: Tailwind CSS v4, GSAP 3 (ScrollTrigger, micro-interactions), Framer Motion
- **Toasts & Icons**: Sonner, Lucide React

---

## 4. Documentation Index

The developer guide is structured into 10 specialized architectural documents:

1. [**ARCHITECTURE.md**](file:///c:/Projects/assetIQ-v2/docs/ARCHITECTURE.md): System architecture, layer boundaries, modular monolith design principles, request pipelines, and Architectural Decision Records (ADRs).
2. [**AUTHENTICATION.md**](file:///c:/Projects/assetIQ-v2/docs/AUTHENTICATION.md): JWT cookie lifecycle, token generation, dual secret separation, refresh persistence, password verification, `auth.middleware.js`, and RBAC permission matrix.
3. [**MULTI_TENANCY.md**](file:///c:/Projects/assetIQ-v2/docs/MULTI_TENANCY.md): Logical multi-tenancy model, `organizationId` scoping, IDOR prevention, WebSocket room isolation, and SuperAdmin global administrative rules.
4. [**ASSET_LIFECYCLE.md**](file:///c:/Projects/assetIQ-v2/docs/ASSET_LIFECYCLE.md): Complete asset state machine (`stock` ↔ `assigned` ↔ `repair` ↔ `retired`), custody assignments, return inspection stepper, and warranty tracking.
5. [**TICKET_WORKFLOW.md**](file:///c:/Projects/assetIQ-v2/docs/TICKET_WORKFLOW.md): Support & procurement ticketing pipeline, claiming, priority SLAs, resolution state changes, automated system messages, and approval workflows.
6. [**REALTIME.md**](file:///c:/Projects/assetIQ-v2/docs/REALTIME.md): Socket.IO handshake auth, room naming conventions, ticket room join authorization, live messaging dispatch, and notification broadcasting.
7. [**AI_SYSTEM.md**](file:///c:/Projects/assetIQ-v2/docs/AI_SYSTEM.md): Ollama integration, model auto-discovery, prompt injection sanitization, 15-minute cooldown caching, and heuristic health fallback.
8. [**DATA_MODEL.md**](file:///c:/Projects/assetIQ-v2/docs/DATA_MODEL.md): Mongoose schemas, relationships, foreign keys, compound indexes, append-only audit constraints, and cascading deletion dependencies.
9. [**FRONTEND.md**](file:///c:/Projects/assetIQ-v2/docs/FRONTEND.md): React component hierarchy, lazy route chunks, TanStack Query cache invalidation, Zustand stores, modal workflows, and responsive layout patterns.
10. [**OPERATIONS.md**](file:///c:/Projects/assetIQ-v2/docs/OPERATIONS.md): Dual environment configuration (`assetowl_dev` vs `assetowl`), seed and reset scripts, Winston logging, error tracing, and deployment runbooks.

---

## 5. Developer "Where To Look" Map

Use this directory map when adding or debugging features:

### 🔐 Authentication, Tokens, & RBAC
- **Token generation & verification**: [`backend/src/utils/token.utils.js`](file:///c:/Projects/assetIQ-v2/backend/src/utils/token.utils.js)
- **Cookie management & login/refresh/logout handlers**: [`backend/src/controllers/auth.controller.js`](file:///c:/Projects/assetIQ-v2/backend/src/controllers/auth.controller.js)
- **Token validation middleware**: [`backend/src/middleware/auth.middleware.js`](file:///c:/Projects/assetIQ-v2/backend/src/middleware/auth.middleware.js)
- **Role guard middleware**: [`backend/src/middleware/rbac.middleware.js`](file:///c:/Projects/assetIQ-v2/backend/src/middleware/rbac.middleware.js)
- **Frontend auth store**: [`frontend/src/stores/auth.store.js`](file:///c:/Projects/assetIQ-v2/frontend/src/stores/auth.store.js)
- **Frontend route protection**: [`frontend/src/components/layout/ProtectedRoute.jsx`](file:///c:/Projects/assetIQ-v2/frontend/src/components/layout/ProtectedRoute.jsx)

### 💻 Asset Fleet & Custody Management
- **Asset business logic**: [`backend/src/services/asset.service.js`](file:///c:/Projects/assetIQ-v2/backend/src/services/asset.service.js)
- **Assignment & return workflows**: [`backend/src/services/assignment.service.js`](file:///c:/Projects/assetIQ-v2/backend/src/services/assignment.service.js)
- **Asset REST routes**: [`backend/src/routes/asset.routes.js`](file:///c:/Projects/assetIQ-v2/backend/src/routes/asset.routes.js)
- **Frontend inventory page**: [`frontend/src/pages/manager/AssetInventory.jsx`](file:///c:/Projects/assetIQ-v2/frontend/src/pages/manager/AssetInventory.jsx)
- **Frontend asset detail page**: [`frontend/src/pages/shared/AssetDetail.jsx`](file:///c:/Projects/assetIQ-v2/frontend/src/pages/shared/AssetDetail.jsx)
- **Frontend return modal**: [`frontend/src/components/modals/ReturnAssetModal.jsx`](file:///c:/Projects/assetIQ-v2/frontend/src/components/modals/ReturnAssetModal.jsx)

### 🎫 Support & Procurement Tickets
- **Ticket service layer**: [`backend/src/services/ticket.service.js`](file:///c:/Projects/assetIQ-v2/backend/src/services/ticket.service.js)
- **Ticket routes & validator schemas**: [`backend/src/routes/ticket.routes.js`](file:///c:/Projects/assetIQ-v2/backend/src/routes/ticket.routes.js) & [`backend/src/validators/ticket.validator.js`](file:///c:/Projects/assetIQ-v2/backend/src/validators/ticket.validator.js)
- **Frontend ticket queue**: [`frontend/src/pages/manager/TicketQueue.jsx`](file:///c:/Projects/assetIQ-v2/frontend/src/pages/manager/TicketQueue.jsx)
- **Frontend ticket discussion view**: [`frontend/src/components/tickets/TicketDiscussionView.jsx`](file:///c:/Projects/assetIQ-v2/frontend/src/components/tickets/TicketDiscussionView.jsx)

### ⚡ Real-Time WebSockets
- **Server-side Socket.IO instance & room guards**: [`backend/src/config/socket.js`](file:///c:/Projects/assetIQ-v2/backend/src/config/socket.js)
- **Message service & broadcast triggers**: [`backend/src/services/message.service.js`](file:///c:/Projects/assetIQ-v2/backend/src/services/message.service.js)
- **Frontend Socket hook**: [`frontend/src/hooks/useSocket.js`](file:///c:/Projects/assetIQ-v2/frontend/src/hooks/useSocket.js)
- **Frontend ticket chat component**: [`frontend/src/components/tickets/TicketChat.jsx`](file:///c:/Projects/assetIQ-v2/frontend/src/components/tickets/TicketChat.jsx)

### 🧠 AI Health Engine (Ollama)
- **Ollama client, prompt sanitizer, & cache**: [`backend/src/services/ai.service.js`](file:///c:/Projects/assetIQ-v2/backend/src/services/ai.service.js)
- **Frontend AI health card**: [`frontend/src/components/assets/AIHealthWidget.jsx`](file:///c:/Projects/assetIQ-v2/frontend/src/components/assets/AIHealthWidget.jsx)

### 🏢 Multi-Tenant & SuperAdmin Management
- **Tenant management & cascading deletion**: [`backend/src/services/admin.service.js`](file:///c:/Projects/assetIQ-v2/backend/src/services/admin.service.js)
- **SuperAdmin REST endpoints**: [`backend/src/routes/admin.routes.js`](file:///c:/Projects/assetIQ-v2/backend/src/routes/admin.routes.js)
- **Frontend SuperAdmin console**: [`frontend/src/pages/superadmin/Organizations.jsx`](file:///c:/Projects/assetIQ-v2/frontend/src/pages/superadmin/Organizations.jsx)

---

## 6. Recommended Reading Order

For a newcomer to the AssetOwl codebase, we recommend reading the documentation in this order:

1. **[README.md](file:///c:/Projects/assetIQ-v2/docs/README.md)** (You are here) — Overview and codebase directory.
2. **[ARCHITECTURE.md](file:///c:/Projects/assetIQ-v2/docs/ARCHITECTURE.md)** — Core design principles, modular layers, and request lifecycle.
3. **[AUTHENTICATION.md](file:///c:/Projects/assetIQ-v2/docs/AUTHENTICATION.md)** — JWT access/refresh token mechanics and RBAC.
4. **[MULTI_TENANCY.md](file:///c:/Projects/assetIQ-v2/docs/MULTI_TENANCY.md)** — Tenant boundaries and cross-tenant security rules.
5. **[DATA_MODEL.md](file:///c:/Projects/assetIQ-v2/docs/DATA_MODEL.md)** — MongoDB entities, relationships, indexes, and constraints.
6. **[ASSET_LIFECYCLE.md](file:///c:/Projects/assetIQ-v2/docs/ASSET_LIFECYCLE.md)** — Physical hardware states, custody assignments, and returns.
7. **[TICKET_WORKFLOW.md](file:///c:/Projects/assetIQ-v2/docs/TICKET_WORKFLOW.md)** — Support, procurement, and SLA pipelines.
8. **[REALTIME.md](file:///c:/Projects/assetIQ-v2/docs/REALTIME.md)** — Socket.IO rooms, events, and live messaging.
9. **[AI_SYSTEM.md](file:///c:/Projects/assetIQ-v2/docs/AI_SYSTEM.md)** — Ollama LLM integration and caching.
10. **[FRONTEND.md](file:///c:/Projects/assetIQ-v2/docs/FRONTEND.md)** — React 19, code splitting, TanStack Query, and Zustand.
11. **[OPERATIONS.md](file:///c:/Projects/assetIQ-v2/docs/OPERATIONS.md)** — Environment configuration, seeding, and runbooks.
