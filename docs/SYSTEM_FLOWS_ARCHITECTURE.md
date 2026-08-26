# AssetIQ System Architecture & End-to-End Execution Flows

This document provides an exhaustive, function-by-function technical specification of the core subsystem flows in **AssetIQ v2**:
1. **Authentication & Multi-Tenant RBAC Flow**
2. **WebSockets Flow (Real-Time Messaging & Instant Notifications)**
3. **AI Intelligence Flow (Ollama LLM Engine, Heuristic Fallback & Health Scoring)**

---

## 1. Authentication & Multi-Tenant RBAC Flow

### 1.1 Overview & Security Architecture
- **Dual-Token Strategy**: Short-lived Access Tokens (15 minutes) and Long-lived Refresh Tokens (7 days).
- **Secure Cookie Transport**: Tokens are transported via HTTP-Only, SameSite, Secure cookies (`accessToken` and `refreshToken`).
- **Multi-Tenant Isolation**: Data access is strictly scoped via `organizationId` index matching on every database query.
- **Four-Tier RBAC**: Role privileges enforced via declarative middleware (`super_admin`, `org_admin`, `asset_manager`, `employee`).

---

### 1.2 Detailed Sequence & Functions Involved

#### A. User Registration (`POST /api/auth/register`)
1. **Frontend Trigger**: [`Register.jsx`](file:///c:/Projects/assetIQ-v2/frontend/src/pages/shared/Register.jsx) invokes [`authApi.register(data)`](file:///c:/Projects/assetIQ-v2/frontend/src/api/auth.api.js), sending an HTTP `POST` request to `/api/auth/register`.
2. **Route Handling**: [`auth.routes.js`](file:///c:/Projects/assetIQ-v2/backend/src/routes/auth.routes.js) routes request to [`authController.register`](file:///c:/Projects/assetIQ-v2/backend/src/controllers/auth.controller.js).
3. **Controller Execution**: `register(req, res)` validates request payload (`email`, `password`, `name`, `role`, `organizationName`) and calls [`authService.registerUser(req.body)`](file:///c:/Projects/assetIQ-v2/backend/src/services/auth.service.js).
4. **Service Logic**:
   - `User.findOne({ email })` ensures email uniqueness across the system.
   - If registering as an `org_admin`, creates a new `Organization` document in MongoDB.
   - Hashes raw password using `bcrypt` via pre-save hooks in [`User.js`](file:///c:/Projects/assetIQ-v2/backend/src/models/User.js).
   - Saves new `User` document populated with `organizationId` and assigned `role`.
   - Generates JWT pair via [`generateAccessToken(user)`](file:///c:/Projects/assetIQ-v2/backend/src/utils/token.utils.js) and `generateRefreshToken(user)`.
5. **Cookie Transport**: Calls [`setTokenCookies(res, accessToken, refreshToken)`](file:///c:/Projects/assetIQ-v2/backend/src/utils/token.utils.js) to attach HTTP-Only cookies to the HTTP response header.

#### B. User Login (`POST /api/auth/login`)
1. **Frontend Trigger**: [`Login.jsx`](file:///c:/Projects/assetIQ-v2/frontend/src/pages/shared/Login.jsx) calls `authStore.login(credentials)` in [`auth.store.js`](file:///c:/Projects/assetIQ-v2/frontend/src/stores/auth.store.js), executing `authApi.login(credentials)`.
2. **Controller Execution**: [`auth.controller.js`](file:///c:/Projects/assetIQ-v2/backend/src/controllers/auth.controller.js) delegates to [`authService.loginUser(req.body)`](file:///c:/Projects/assetIQ-v2/backend/src/services/auth.service.js).
3. **Service Logic**:
   - Queries `User.findOne({ email }).select('+password')`.
   - Verifies account status is `active`.
   - Calls `user.comparePassword(password)` to verify `bcrypt` password match.
   - Issues fresh `accessToken` (15m) and `refreshToken` (7d).
   - Saves `refreshToken` hash to `user.refreshToken` in MongoDB and updates `user.lastLogin = new Date()`.
4. **Session State**: Sets HTTP-Only cookies and returns user profile JSON. Frontend store updates `isAuthenticated = true` and `user` state.

#### C. Request Authentication & RBAC Verification
1. **Middleware Step 1 (`authenticateUser`)**: [`auth.middleware.js`](file:///c:/Projects/assetIQ-v2/backend/src/middlewares/auth.middleware.js)
   - Extracts access token from `req.cookies.accessToken` or `Authorization: Bearer <token>`.
   - Invokes [`verifyAccessToken(token)`](file:///c:/Projects/assetIQ-v2/backend/src/utils/token.utils.js).
   - Attaches `req.user = { _id, email, role, organizationId, name }` to Express request object.
2. **Middleware Step 2 (`requireRole`)**: [`auth.middleware.js`](file:///c:/Projects/assetIQ-v2/backend/src/middlewares/auth.middleware.js)
   - Verifies `allowedRoles.includes(req.user.role)`. Throws `ApiError(403, 'Forbidden')` if role check fails.
3. **Middleware Step 3 (`requireSameOrg`)**: [`auth.middleware.js`](file:///c:/Projects/assetIQ-v2/backend/src/middlewares/auth.middleware.js)
   - Verifies `targetResource.organizationId === req.user.organizationId` to prevent cross-tenant data leaks.

#### D. Automatic Token Refresh & Interception
1. **Frontend Interceptor**: [`axios.config.js`](file:///c:/Projects/assetIQ-v2/frontend/src/api/axios.config.js) interceptor catches HTTP `401 Unauthorized`.
2. **Refresh Execution**: Sends `POST /api/auth/refresh-token`.
3. **Service Execution**: [`authService.refreshTokenService(token)`](file:///c:/Projects/assetIQ-v2/backend/src/services/auth.service.js) verifies `refreshToken`, checks DB match in `User` model, issues a new token pair, and updates cookies seamlessly without logging out the user.

#### E. User Logout (`POST /api/auth/logout`)
1. **Controller**: [`auth.controller.js`](file:///c:/Projects/assetIQ-v2/backend/src/controllers/auth.controller.js) invokes `authService.logoutUser(req.user._id)`.
2. **Cleanup**: Clears stored `refreshToken` on `User` document in MongoDB and calls [`clearTokenCookies(res)`](file:///c:/Projects/assetIQ-v2/backend/src/utils/token.utils.js).

---

## 2. WebSockets Flow (Real-Time Messaging & Instant Notifications)

### 2.1 Overview & Architecture
- **Persistent Socket.IO Connection**: Maintained between client singletons and Express HTTP backend.
- **Handshake Authentication**: Sockets are authenticated during connection handshake using JWT cookies/headers.
- **Isolated Socket Rooms**:
  - `user:<userId>` — Private room per authenticated user for targeted desktop notifications.
  - `conversation:<conversationId>` — Isolated channel per support case or conversation thread.
  - `ticket:<ticketId>` — Legacy maintenance ticket discussion room.

---

### 2.2 Detailed Sequence & Functions Involved

#### A. Socket Initialization & Handshake Authentication
1. **Server Boot**: [`initSocket(httpServer)`](file:///c:/Projects/assetIQ-v2/backend/src/config/socket.js#L12) mounts Socket.IO server with CORS policies (`credentials: true`).
2. **Auth Handshake Middleware**: [`socket.js`](file:///c:/Projects/assetIQ-v2/backend/src/config/socket.js#L26-L79) `io.use((socket, next) => ...)`:
   - Extracts JWT token from `socket.handshake.headers.cookie` (`accessToken`) or `socket.handshake.auth.token`.
   - Executes [`verifyAccessToken(token)`](file:///c:/Projects/assetIQ-v2/backend/src/utils/token.utils.js).
   - Attaches `socket.userId`, `socket.userRole`, `socket.orgId`, and `socket.user` identity object directly to the socket.
   - Rejects unauthenticated connections with `Authentication error`.
3. **Client Singleton Hook**: [`useSocket.js`](file:///c:/Projects/assetIQ-v2/frontend/src/hooks/useSocket.js#L7-L63) maintains persistent single `io()` socket connection across frontend routes.

#### B. Private Notification Stream (`user:<userId>`)
1. **Room Auto-Join**: Upon connection, [`socket.js`](file:///c:/Projects/assetIQ-v2/backend/src/config/socket.js#L88) automatically joins `user:<socket.userId>`.
2. **Event Trigger**: When business events occur (ticket created, assignment updated, procurement approval):
   - Service: [`notification.service.js`](file:///c:/Projects/assetIQ-v2/backend/src/services/notification.service.js) triggers `createNotification()`, `notifyAssetManagersOnTicketCreated()`, `notifyOrgAdminsOnTicketEscalated()`, or `notifySuperAdminsOnTicketCreated()`.
   - Emitter Call: Calls `emitToUser(userId, 'new-notification', notificationData)`.
3. **Socket Server Emitter**: [`socket.js`](file:///c:/Projects/assetIQ-v2/backend/src/config/socket.js#L342) executes `emitToUser(userId, event, data)` -> `io.to('user:' + userId).emit(event, data)`.
4. **Client Notification Listener**: [`useNotificationSocket.js`](file:///c:/Projects/assetIQ-v2/frontend/src/hooks/useNotificationSocket.js) listens for `new-notification`, renders a toast notification via `sonner`, and invalidates React Query unread notification badge counters.

#### C. Real-Time Chat & Ticket Messages (`conversation:<id>`)
1. **Joining Room**:
   - Frontend: [`TicketChat.jsx`](file:///c:/Projects/assetIQ-v2/frontend/src/components/tickets/TicketChat.jsx#L61) emits `socket.emit('conversation:join', conversationId)`.
   - Backend Handler: [`socket.js`](file:///c:/Projects/assetIQ-v2/backend/src/config/socket.js#L96) `socket.on('conversation:join')`:
     - Checks conversation ID validity.
     - Executes centralized authorization check via [`verifyConversationAccess(conversation, socket.user)`](file:///c:/Projects/assetIQ-v2/backend/src/services/conversation.service.js#L111).
     - Joins room `socket.join('conversation:' + conversationId)`.
2. **Sending & Broadcasting Messages**:
   - Frontend: [`TicketChat.jsx`](file:///c:/Projects/assetIQ-v2/frontend/src/components/tickets/TicketChat.jsx) emits `socket.emit('message:send', { conversationId, content, isInternal })`.
   - Backend Handler: [`socket.js`](file:///c:/Projects/assetIQ-v2/backend/src/config/socket.js#L137) `socket.on('message:send')`:
     - Re-verifies room authorization via `verifyConversationAccess()`.
     - Asserts RBAC write permissions (SuperAdmin maintenance ticket read-only restriction; Employee internal note restriction).
     - Calls [`conversationService.addMessageToConversation()`](file:///c:/Projects/assetIQ-v2/backend/src/services/conversation.service.js) to persist message in MongoDB `Message` collection.
3. **Server-Side Internal Note Filtering**:
   - If `savedMessage.isInternal === true`:
     - Backend fetches sockets via `io.in('conversation:' + conversationId).fetchSockets()`.
     - Emits `message:new` ONLY to sockets where `s.userRole !== 'employee'`.
   - If public message:
     - Emits `io.to('conversation:' + conversationId).emit('message:new', savedMessage)` to all members.
4. **Client UI Update**: [`TicketChat.jsx`](file:///c:/Projects/assetIQ-v2/frontend/src/components/tickets/TicketChat.jsx#L87) listens for `message:new` and appends message to live thread state.

---

## 3. AI Intelligence Flow (Ollama LLM Engine, Heuristic Fallback & Health Scoring)

### 3.1 Overview & Architecture
- **Local Ollama LLM Integration**: Connects to local Ollama AI instance (`http://127.0.0.1:11434/api/generate`) with automatic model discovery (`qwen2.5:3b`, `llama3.1`, `mistral`).
- **Hybrid Intelligence Engine**: Combines generative LLM reasoning with a deterministic mathematical heuristic engine fallback.
- **Hallucination Safeguards**: Strict post-processing validation enforces physical limits on health scores, failure risk percentages, and replacement recommendations.
- **Cooldown & Cache Layer**: Enforces a 15-minute analysis cooldown to optimize system resources.

---

### 3.2 Detailed Sequence & Functions Involved

#### A. Triggering AI Asset Evaluation (`POST /api/assets/:id/analyze-ai`)
1. **Frontend Trigger**: [`AssetDetail.jsx`](file:///c:/Projects/assetIQ-v2/frontend/src/pages/shared/AssetDetail.jsx) calls [`assetApi.analyzeAssetAI(assetId)`](file:///c:/Projects/assetIQ-v2/frontend/src/api/asset.api.js), sending `POST /api/assets/:id/analyze-ai`.
2. **Route Handling**: [`asset.routes.js`](file:///c:/Projects/assetIQ-v2/backend/src/routes/asset.routes.js) routes to [`assetController.analyzeAssetAI`](file:///c:/Projects/assetIQ-v2/backend/src/controllers/asset.controller.js).
3. **Controller Execution**: Delegates to [`aiService.analyzeAssetHealth(assetId, organizationId, user, options)`](file:///c:/Projects/assetIQ-v2/backend/src/services/ai.service.js#L354).

#### B. Data Gathering & Context Assembly
1. **Function**: [`gatherAssetContext(assetId, organizationId, user)`](file:///c:/Projects/assetIQ-v2/backend/src/services/ai.service.js#L78):
   - Queries `Asset` document populated with `categoryId`, `vendorId`, `locationId`.
   - Queries `Ticket` collection for repair count, open defect issues, total repair cost, last repair date.
   - Queries `Assignment` collection for total assignments and active employee assignment status.
   - Queries `Warranty` collection for OEM warranty status (`active` vs `expired`).
   - Calculates operational age in months vs category expected lifespan.

#### C. Model Discovery & Prompt Construction
1. **Model Discovery**: [`getAvailableOllamaModel()`](file:///c:/Projects/assetIQ-v2/backend/src/services/ai.service.js#L19) queries `${OLLAMA_BASE_URL}/api/tags` and auto-selects preferred installed model (`qwen2.5:3b`, `llama3.1`, `mistral`).
2. **Prompt Sanitization & Construction**: [`buildPrompt(context)`](file:///c:/Projects/assetIQ-v2/backend/src/services/ai.service.js#L165):
   - Sanitizes text inputs via `sanitizePromptInput()` to prevent prompt injection attacks.
   - Computes baseline heuristic health via [`calculateHeuristicHealth(context)`](file:///c:/Projects/assetIQ-v2/backend/src/services/ai.service.js#L206).
   - Generates strict JSON-formatted prompt containing equipment telemetry.

#### D. LLM Processing & Post-Processing Guardrails
1. **Ollama Execution**: Sends HTTP POST to `http://127.0.0.1:11434/api/generate` with `{ model, prompt, format: 'json', temperature: 0.2 }`.
2. **Parsing & Hallucination Guardrails**: [`parseAIResponse(rawText, fallbackContext)`](file:///c:/Projects/assetIQ-v2/backend/src/services/ai.service.js#L282):
   - Extracts JSON payload from LLM response.
   - **Guardrail 1**: If asset status is `repair` or active defect tickets exist, clamps `healthScore <= 42`.
   - **Guardrail 2**: If asset status is `retired`, forces `healthScore = 5`.
   - **Guardrail 3**: Re-aligns failure risk percentage and replacement recommendation (`keep`, `repair`, `replace`) to maintain mathematical logical consistency.
3. **Heuristic Engine Fallback**: If Ollama server is offline or times out (45s), automatically executes [`calculateHeuristicHealth(context)`](file:///c:/Projects/assetIQ-v2/backend/src/services/ai.service.js#L206) with `source: 'heuristic_fallback'`.

#### E. Database Persistence & Audit Logging
1. **Asset Document Update**: Updates `asset.ai` fields (`healthScore`, `failureRiskPercent`, `remainingUsefulLifeMonths`, `predictedNextMaintenanceDate`, `insights`, `replacementRecommendation`, `lastAnalyzedAt`).
2. **History Tracking**: Pushes entry to `asset.healthHistory` array (capped at last 30 entries).
3. **Audit Log**: Calls [`logAudit()`](file:///c:/Projects/assetIQ-v2/backend/src/services/audit.service.js) to record `ai_health_analyzed` event with model and engine metadata.

---

## 4. Master Technical Reference Table

| Subsystem | File Path | Key Functions & Exported Methods |
| :--- | :--- | :--- |
| **Auth Models** | [`backend/src/models/User.js`](file:///c:/Projects/assetIQ-v2/backend/src/models/User.js) | `comparePassword()`, `hashPassword()` |
| **Auth Utilities** | [`backend/src/utils/token.utils.js`](file:///c:/Projects/assetIQ-v2/backend/src/utils/token.utils.js) | `generateAccessToken()`, `generateRefreshToken()`, `verifyAccessToken()`, `setTokenCookies()`, `clearTokenCookies()` |
| **Auth Middleware** | [`backend/src/middlewares/auth.middleware.js`](file:///c:/Projects/assetIQ-v2/backend/src/middlewares/auth.middleware.js) | `authenticateUser()`, `requireRole()`, `requireSameOrg()`, `requireSuperAdmin()` |
| **Auth Services** | [`backend/src/services/auth.service.js`](file:///c:/Projects/assetIQ-v2/backend/src/services/auth.service.js) | `registerUser()`, `loginUser()`, `refreshTokenService()`, `logoutUser()`, `getCurrentUser()` |
| **Auth Controllers** | [`backend/src/controllers/auth.controller.js`](file:///c:/Projects/assetIQ-v2/backend/src/controllers/auth.controller.js) | `register()`, `login()`, `logout()`, `refreshToken()`, `getMe()` |
| **Frontend Auth Store** | [`frontend/src/stores/auth.store.js`](file:///c:/Projects/assetIQ-v2/frontend/src/stores/auth.store.js) | `login()`, `logout()`, `checkAuth()` |
| **Socket Config & Server** | [`backend/src/config/socket.js`](file:///c:/Projects/assetIQ-v2/backend/src/config/socket.js) | `initSocket()`, `io.use()`, `conversation:join`, `message:send`, `emitToUser()`, `emitToConversation()` |
| **Notification Services** | [`backend/src/services/notification.service.js`](file:///c:/Projects/assetIQ-v2/backend/src/services/notification.service.js) | `createNotification()`, `notifyAssetManagersOnTicketCreated()`, `notifyOrgAdminsOnTicketEscalated()` |
| **Conversation Services** | [`backend/src/services/conversation.service.js`](file:///c:/Projects/assetIQ-v2/backend/src/services/conversation.service.js) | `verifyConversationAccess()`, `addMessageToConversation()` |
| **Frontend Socket Hook** | [`frontend/src/hooks/useSocket.js`](file:///c:/Projects/assetIQ-v2/frontend/src/hooks/useSocket.js) | `useSocket()` persistent singleton hook |
| **Frontend Notification Hook**| [`frontend/src/hooks/useNotificationSocket.js`](file:///c:/Projects/assetIQ-v2/frontend/src/hooks/useNotificationSocket.js) | `useNotificationSocket()` notification listener hook |
| **Frontend Chat UI** | [`frontend/src/components/tickets/TicketChat.jsx`](file:///c:/Projects/assetIQ-v2/frontend/src/components/tickets/TicketChat.jsx) | `TicketChat` component, `socket.emit('message:send')`, `socket.on('message:new')` |
| **AI Intelligence Service** | [`backend/src/services/ai.service.js`](file:///c:/Projects/assetIQ-v2/backend/src/services/ai.service.js) | `gatherAssetContext()`, `buildPrompt()`, `calculateHeuristicHealth()`, `parseAIResponse()`, `analyzeAssetHealth()`, `getAvailableOllamaModel()` |
| **Asset Service (Health)** | [`backend/src/services/asset.service.js`](file:///c:/Projects/assetIQ-v2/backend/src/services/asset.service.js) | `computeAndStoreHealthScore()`, `getAssets()` |
| **Asset Controller (AI)** | [`backend/src/controllers/asset.controller.js`](file:///c:/Projects/assetIQ-v2/backend/src/controllers/asset.controller.js) | `analyzeAssetAI()` |
