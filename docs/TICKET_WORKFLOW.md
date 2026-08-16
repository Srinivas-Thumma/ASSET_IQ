# AssetOwl Ticket & Procurement Workflow Guide

## 1. Ticket System Architecture

AssetOwl provides a unified service desk for IT support, hardware maintenance, equipment returns, and hardware procurement requests.

```mermaid
stateDiagram-v2
    [*] --> Open: Ticket Created (Employee or Manager)
    
    Open --> Claimed: Manager Claims Ticket (PATCH /api/tickets/:id/claim)
    
    Claimed --> InProgress: Work Commences or Procurement Approved (PATCH /api/tickets/:id/status)
    Open --> InProgress: Procurement Approved directly
    
    InProgress --> Resolved: Issue Fixed & Hardware Updated (PATCH /api/tickets/:id/resolve)
    
    Open --> Closed: Procurement Rejected (PATCH /api/tickets/:id/status)
    InProgress --> Closed: Procurement Cancelled
    
    Resolved --> Closed: Verification Complete
    
    Closed --> [*]
```

---

## 2. Ticket Types & Domain Routing

Tickets are classified into 5 primary types:

| Type | Intended Use Case | Typical Requester | Routing Domain |
|------|-------------------|-------------------|----------------|
| `repair` | Hardware defect, broken screen, battery failure | Employee / Manager | Hardware Team / Asset Manager |
| `request` | New hardware procurement, peripheral request | Employee | Org Admin (Pending Approvals) |
| `return` | Equipment return and surrender request | Employee | Asset Manager / Inspection Stepper |
| `support` | General IT support, software, network issues | Employee | IT Support Team |
| `admin_support`| Billing, plan upgrades, administrative questions | Org Admin | SuperAdmin Support Queue |

---

## 3. Priority Levels & SLA Escalations

- **`p1` (Critical)**: Total work stoppage / executive escalation. Auto-elevated on ticket escalation.
- **`p2` (High)**: Major degradation of hardware functionality.
- **`p3` (Medium)**: Standard hardware or procurement request.
- **`p4` (Low)**: Minor inquiry or long-term accessory request.

### Auto-Escalation ([`ticket.service.js:escalateTicket`](file:///c:/Projects/assetIQ-v2/backend/src/services/ticket.service.js))
When a ticket is escalated:
1. `ticket.isEscalated = true`.
2. Priority is elevated to `p1` if currently `p3` or `p4`.
3. Creates automated system broadcast message in ticket discussion.
4. Appears prominently in the Org Admin Exception Queue (`/admin/exceptions`).

---

## 4. Procurement Approval Flow

```mermaid
sequenceDiagram
    autonumber
    actor Emp as Employee
    participant UI as OrgAdmin Dashboard
    participant API as Ticket API (/api/tickets/:id/status)
    participant Svc as ticket.service.js
    participant Msg as TicketMessage Model
    participant Skt as Socket.IO Hub

    Emp->>Svc: Creates Ticket (type: 'request', title: 'New 4K Monitor')
    UI->>API: OrgAdmin clicks "Approve" (status: 'in_progress')
    API->>Svc: updateTicketStatus(id, { status: 'in_progress', resolutionNotes: 'Approved' })
    Svc->>Svc: Updates ticket.status = 'in_progress'
    Svc->>Msg: TicketMessage.create(System: "Procurement approved")
    Svc->>Skt: emitToTicket(id, 'new-message', sysMsg)
    Svc-->>UI: 200 OK (Procurement in progress)
```

---

## 5. Maintenance Resolution & Asset State Changes

When an IT manager resolves a hardware repair ticket (`PATCH /api/tickets/:id/resolve` or `PATCH /api/tickets/:id/status`):
- The manager can pass `{ assetStateChange: 'stock' }` or `{ assetStateChange: 'retired' }`.
- The service automatically:
  1. Updates `ticket.status = 'resolved'`.
  2. Updates `ticket.resolvedAt = new Date()` and `ticket.resolvedBy = user._id`.
  3. Updates linked `Asset.status` (e.g., from `repair` back to `stock`).
  4. Records `asset_state_change` and `ticket_resolved` entries in `AuditLog`.
  5. Broadcasts real-time discussion update and notifies the employee.

---

## 6. Key Functions Reference

### `updateTicketStatus(ticketId, data, user)`
- **File**: [`backend/src/services/ticket.service.js`](file:///c:/Projects/assetIQ-v2/backend/src/services/ticket.service.js)
- **Inputs**: `ticketId`, `{ status, resolutionNotes, priority, assetStateChange }`, `user` context.
- **Why It Exists**: Handles arbitrary state transitions (`in_progress`, `closed`, `resolved`) for procurement and support workflows.
- **What Breaks If Changed**: Org Admin procurement approvals/rejections fail to transition correctly.

### `claimTicket(ticketId, priority, user)`
- **File**: [`backend/src/services/ticket.service.js`](file:///c:/Projects/assetIQ-v2/backend/src/services/ticket.service.js)
- **Inputs**: `ticketId`, `priority`, `user` context.
- **Behavior**: Sets `ticket.handler = user._id`, `ticket.status = 'claimed'`, and notifies employee.
