# AssetOwl Multi-Tenancy & Tenant Isolation Guide

## 1. Multi-Tenancy Model: Logical Tenant Partitioning

AssetOwl implements **logical multi-tenancy** within a unified MongoDB database. Every tenant is represented as an `Organization` record, and all domain records (users, employees, assets, assignments, tickets, messages, notifications, categories, departments, locations, vendors, and warranties) contain a mandatory `organizationId` foreign key.

```mermaid
graph TD
    ClientA["Org A Client<br/>(JWT: orgId = 'org-1')"]
    ClientB["Org B Client<br/>(JWT: orgId = 'org-2')"]
    Express["Express Backend API"]
    Mongo[("Shared MongoDB Database")]

    ClientA -->|Request + HttpOnly Cookie| Express
    ClientB -->|Request + HttpOnly Cookie| Express

    Express -->|Query { organizationId: 'org-1' }| Mongo
    Express -->|Query { organizationId: 'org-2' }| Mongo

    subgraph "Logical Database Partitions"
        OrgAData[("Org A Documents<br/>- Assets<br/>- Tickets<br/>- Personnel")]
        OrgBData[("Org B Documents<br/>- Assets<br/>- Tickets<br/>- Personnel")]
    end

    Mongo --- OrgAData
    Mongo --- OrgBData
```

---

## 2. The Golden Rule of Tenant Isolation

> **Fundamental Constraint**: A request initiated by a user in Organization A **MUST NEVER** read, modify, delete, or receive real-time notifications for data belonging to Organization B.

### Correct vs Dangerous Query Patterns

#### ❌ Dangerous (Vulnerable to IDOR):
```javascript
// BAD: Only checks document ID; allows Org A user to read/modify Org B asset if ID is guessed
const asset = await Asset.findById(req.params.id);
```

#### ✅ Secure (Tenant-Scoped Query):
```javascript
// GOOD: Strictly scopes the query to the authenticated user's organizationId
const asset = await Asset.findOne({
  _id: req.params.id,
  organizationId: req.user.organizationId
});
if (!asset) throw new ApiError(404, 'Asset not found');
```

---

## 3. Tenant Enforcement by Architectural Layer

### 1. REST API Layer
Every authenticated route passes through [`auth.middleware.js`](file:///c:/Projects/assetIQ-v2/backend/src/middleware/auth.middleware.js), which populates `req.user.organizationId` directly from the cryptographically verified JWT access token. Controllers forward `req.user.organizationId` (or `req.user`) to the service layer.

### 2. Service Layer
Domain services (`asset.service.js`, `ticket.service.js`, `assignment.service.js`, `message.service.js`, `personnel.service.js`) append `{ organizationId: user.organizationId }` to all Mongoose query filters, ensuring that cross-tenant access attempts return `404 Not Found` rather than leaking record existence.

### 3. Real-Time WebSocket Layer
In [`socket.js`](file:///c:/Projects/assetIQ-v2/backend/src/config/socket.js):
- Sockets are stamped with `socket.orgId = decoded.organizationId` during the authenticated handshake.
- When a client emits `join-ticket`, the server queries the database for the ticket and verifies:
  ```javascript
  if (!socket.orgId || String(ticket.organizationId) !== String(socket.orgId)) {
    logger.warn(`SECURITY ALERT: Cross-tenant ticket room join blocked.`);
    socket.emit('error', { message: 'Unauthorized: Ticket does not belong to your organization' });
    return;
  }
  ```
- Cross-tenant socket message injection via `send-message` is blocked before calling `messageService.addMessage()`.

### 4. Background Warranty Jobs
[`notification.service.js`](file:///c:/Projects/assetIQ-v2/backend/src/services/notification.service.js) groups assets and warranties strictly by `organizationId`. Notifications are dispatched exclusively to managers and admins belonging to that specific tenant's `organizationId`.

---

## 4. SuperAdmin Global Access Exception

Users with the role `super_admin` are platform operators responsible for SaaS health, plan configurations, and organization lifecycle management.

### Rules for SuperAdmin Access:
1. **Global Route Scoping**: SuperAdmin routes live exclusively under `/api/admin/*` and are guarded by `requireRole(['super_admin'])`.
2. **Organization Detail Access**: SuperAdmin can inspect metrics and fleets for any organization by passing `orgId` as an explicit path parameter (`GET /api/admin/organizations/:id`).
3. **Cross-Tenant Ticket Rooms**: SuperAdmins can join any ticket room for system support.
4. **Complete Cascading Purge**: When a SuperAdmin deletes an organization (`deleteOrganization`), the backend executes an atomic multi-collection purge across all 14 tenant-linked collections to ensure zero orphaned data remains.

---

## 5. Cascading Deletion & Orphan Prevention

When an organization is deleted via [`admin.service.js`](file:///c:/Projects/assetIQ-v2/backend/src/services/admin.service.js), the following collections are cleaned up:

```javascript
// 1. Fetch user IDs to delete indirect relationships (RefreshToken)
const users = await User.find({ organizationId: orgId }).select('_id').lean();
const userIds = users.map((u) => u._id);

// 2. Cascade delete all documents across all tenant-linked models
await Promise.all([
  Organization.findByIdAndDelete(orgId),
  User.deleteMany({ organizationId: orgId }),
  RefreshToken.deleteMany({ userId: { $in: userIds } }),
  Employee.deleteMany({ organizationId: orgId }),
  Asset.deleteMany({ organizationId: orgId }),
  Assignment.deleteMany({ organizationId: orgId }),
  Warranty.deleteMany({ organizationId: orgId }),
  Ticket.deleteMany({ organizationId: orgId }),
  TicketMessage.deleteMany({ organizationId: orgId }),
  Notification.deleteMany({ organizationId: orgId }),
  Category.deleteMany({ organizationId: orgId }),
  Department.deleteMany({ organizationId: orgId }),
  Location.deleteMany({ organizationId: orgId }),
  Vendor.deleteMany({ organizationId: orgId })
]);
```

*(Note: `AuditLog` records are append-only by design and protected from bulk mutation).*
