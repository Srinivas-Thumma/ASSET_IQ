# AssetIQ Technical Documentation Index

Detailed end-to-end technical documentation files for each core system flow:

### 📄 1. [Authentication & Multi-Tenant RBAC Flow](file:///c:/Projects/assetIQ-v2/docs/AUTHENTICATION_FLOW.md)
Exhaustive line-by-line breakdown of User & Organization database schemas, JWT token generation, HTTP-Only cookie transport, security middleware (`authenticateUser`, `requireRole`, `requireSameOrg`), refresh token interceptors, and session management.

### 📄 2. [WebSockets Flow (Messages & Notifications)](file:///c:/Projects/assetIQ-v2/docs/SOCKETS_FLOW.md)
Detailed specification of Socket.IO server initialization, handshake JWT authentication, socket room channels (`user:<id>`, `conversation:<id>`, `ticket:<id>`), backend emit functions (`emitToUser`, `emitToConversation`), server-side internal note filtering for staff vs employees, client hooks (`useSocket`, `useNotificationSocket`), and the live chat UI component.

### 📄 3. [AI Intelligence Engine & Health Scoring Flow](file:///c:/Projects/assetIQ-v2/docs/AI_FLOW.md)
Complete technical guide for the local Ollama LLM integration, dynamic model auto-discovery, telemetry context gathering, prompt sanitization, hallucination guardrail enforcement, deterministic mathematical heuristic fallback engine, health score history tracking, audit logging, and UI components.
