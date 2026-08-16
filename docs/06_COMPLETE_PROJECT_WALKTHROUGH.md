# 06 — Complete AssetOwl Master Walkthrough

Welcome to **AssetOwl v2**. This guide explains the entire architecture, data flows, lifecycles, and request journeys from zero to mastery.

---

## 1. What AssetOwl Is & Why It Exists

In modern companies, managing hardware assets (laptops, monitors, phones) and software licenses across onboarding, offboarding, repairs, and vendor warranties is notoriously prone to loss, data silos, and compliance breaches.

AssetOwl solves this by providing:
1. **Hierarchical Organization & Multi-Tenancy**: Complete data isolation between organizations.
2. **Custody & Physical Inspection Tracking**: Audited asset handovers with pre-return and post-inspection signoffs.
3. **Integrated Helpdesk & Ticketing**: Live WebSocket chat between asset managers and employees.
4. **Warranty Life Cycle Management**: Proactive alerts before manufacturer coverage expires.
5. **AI-Assisted Health & Lifecycle Scoring**: Predictive failure risk, lifespan modeling, and replacement recommendations.

---

## 2. End-to-End Request Lifecycles

### Lifecycle A: User Opens the Assets Page (`/assets`)

```
1. User clicks "Assets" in Sidebar navigation.
2. React Router mounts `AssetInventory.jsx`.
3. TanStack React Query runs `useAssets()` hook -> calls `assetApi.getAssets()`.
4. Axios issues `GET /api/assets` with `withCredentials: true`.
5. Browser automatically attaches `accessToken` HttpOnly cookie.
6. Express routes request through `app.use('/api', apiRouter)`.
7. `auth.middleware.js` extracts `accessToken`, verifies signature with `JWT_SECRET`, and populates `req.user = { _id, role, organizationId }`.
8. `asset.controller.js` parses query params (e.g. `status`, `search`, `page`).
9. Mongoose runs `Asset.find({ organizationId: req.user.organizationId })` with pagination and populates category/location/vendor references.
10. Backend responds with `200 OK` JSON via `ApiResponse(200, { assets, pagination }, "Assets fetched")`.
11. React Query caches data under `['assets', params]`.
12. `AssetInventory.jsx` updates state and triggers GSAP table row entrance: `gsap.fromTo(rows, { opacity: 0, y: 15 }, { opacity: 1, y: 0, stagger: 0.04, clearProps: 'all' })`.
```

---

### Lifecycle B: User Login (`/login`)

```
1. User enters email (`admin@techflow.dev`) and password (`password123`) in `LoginPage.jsx`.
2. Form submits -> Zustand `useAuthStore.login(email, password)` invokes `auth.api.js`.
3. Axios sends `POST /api/auth/login` with `{ email, password }`.
4. `auth.controller.js` validates input and looks up `User.findOne({ email }).populate('employeeRef')`.
5. Verifies account status (`status === 'active'`).
6. Runs `bcrypt.compare(password, user.passwordHash)`.
7. Generates 15-minute `accessToken` and 7-day `refreshToken`.
8. Stores `RefreshToken` in MongoDB with TTL index.
9. Sets `accessToken` and `refreshToken` as secure `HttpOnly` cookies on the response.
10. Returns user profile JSON (`_id`, `email`, `name`, `role`, `organizationId`).
11. Frontend saves profile JSON in `localStorage('assetowl_user')` and sets Zustand `isAuthenticated: true`.
12. React Router redirects user to their role's default dashboard (`/dashboard` for admins, `/my-assets` for employees).
```

---

### Lifecycle C: Asset Assignment

```
1. Asset Manager selects an asset in "stock" status and clicks "Assign Asset".
2. Submits employee ID in modal -> `useMutation` triggers `POST /api/assignments`.
3. Backend creates `Assignment` document with `assignedBy: req.user._id` and updates `Asset.status = 'assigned'`.
4. An `AuditLog` entry is recorded (`action: 'assignment_created'`).
5. A `Notification` document is created for the assigned employee.
6. Socket server emits `asset_assigned` event to room `user:<employeeId>`.
7. React Query invalidates `['assets']` and `['assignments']`, updating UI tables smoothly.
```

---

### Lifecycle D: Real-Time Ticket Messaging

```
1. User opens a ticket detail view (`/tickets/:id`).
2. Component triggers socket event: `socket.emit('join-ticket', ticketId)`.
3. Socket.IO adds socket connection to room `ticket:<ticketId>`.
4. User types a message and sends: `socket.emit('send-message', { ticketId, message, isInternal })`.
5. Backend socket listener receives payload, validates sender credentials, and invokes `messageService.addMessage()`.
6. Message is saved into `TicketMessage` collection.
7. Socket server broadcasts `io.to('ticket:' + ticketId).emit('new-message', savedMessage)`.
8. Both user and support agent clients receive event and append message to live chat timeline.
```

---

### Lifecycle E: Automatic Token Refresh

```
1. Access token expires after 15 minutes.
2. User performs an action (e.g. clicks "Update Asset").
3. Request fails with `401 Unauthorized`.
4. Axios response interceptor intercepts 401 error.
5. Flags `isRefreshing = true` and queues pending requests in `failedQueue`.
6. Sends `POST /api/auth/refresh` (browser sends `refreshToken` cookie automatically).
7. Backend verifies refresh token against MongoDB `RefreshToken` collection.
8. Backend issues new `accessToken` cookie and returns `200 OK`.
9. Axios interceptor resolves `failedQueue` and replays the original request.
10. The user experiences zero interruption or login prompts.
```

---

## 3. Step-by-Step Developer Quickstart

```bash
# 1. Clone repository & install dependencies
cd c:/Projects/assetIQ-v2
npm install
cd backend && npm install
cd ../frontend && npm install

# 2. Seed development database
cd ../backend
npm run seed:dev

# 3. Start Backend dev server (port 5000)
npm run dev

# 4. In a separate terminal, start Frontend dev server (port 5173)
cd ../frontend
npm run dev

# 5. Open browser at http://localhost:5173 and sign in with:
#    Email:    admin@techflow.dev
#    Password: password123
```
