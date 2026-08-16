# 03 — Feature Flows and Lifecycles

## 1. Asset Lifecycle Flow

AssetOwl enforces structured states defined in `Asset.status`:

```
┌──────────────┐     Assignment Created     ┌─────────────────┐
│              ├───────────────────────────►│                 │
│    STOCK     │                            │    ASSIGNED     │
│ (Inventory)  │◄───────────────────────────┤   (In Custody)  │
└──────┬───────┘   Return & Pass Inspection └────────┬────────┘
       │                                             │
       │ Repair Ticket                               │ Defective Return /
       │ Opened                                      │ Damaged
       ▼                                             ▼
┌──────────────┐     Repairs Completed      ┌─────────────────┐
│              ├───────────────────────────►│                 │
│    REPAIR    │                            │     RETIRED     │
│ (Under Maint)│   Decommission / Obsolete  │ (Decommissioned)│
└──────────────┴───────────────────────────►└─────────────────┘
```

### State Definitions
1. **`stock`**: Asset is in warehouse/inventory, ready for assignment.
2. **`assigned`**: Asset is deployed and actively assigned to an employee via an `Assignment` record.
3. **`repair`**: Asset has experienced a fault/damage and is linked to an active repair ticket.
4. **`retired`**: Asset has reached end-of-life, passed retirement inspection, or been decommissioned.

---

## 2. Asset Assignment & Return Inspection Lifecycle

```
[Asset Manager]                                  [Employee]
       │                                              │
       ├─── 1. Create Assignment ────────────────────►│
       │    (Asset.status -> 'assigned')              │ Receives Hardware
       │                                              │
       │                                              ├─── 2. Initiate Return (e.g. Offboarding)
       │◄── Notification Dispatched ──────────────────┤    (Assignment.returnInitiatedAt set)
       │
       ├─── 3. Physical Inspection
       │    - pass         -> Asset.status: 'stock', Assignment.returnedAt set
       │    - fail_repair  -> Asset.status: 'repair', Ticket auto-created
       │    - fail_retire  -> Asset.status: 'retired', Assignment.returnedAt set
       ▼
[Complete Audit Log Recorded]
```

---

## 3. Ticket & Maintenance Lifecycle

Tickets use the `Ticket.js` model with statuses: `open` ➔ `claimed` ➔ `in_progress` ➔ `resolved` ➔ `closed`.

```
[Employee / User]                                [Asset Manager / IT]
       │                                                   │
       ├─── 1. POST /api/tickets (status: 'open') ────────►│
       │    (type: repair | request | support | return)    │
       │                                                   ├─── 2. PATCH /api/tickets/:id/claim
       │                                                   │    (status: 'claimed', handler assigned)
       │                                                   │
       │◄── 3. Real-Time Socket Messaging (ticket:<id>) ──►│
       │    (TicketMessage saved & broadcasted)            ├─── 4. Status: 'in_progress'
       │                                                   │
       │                                                   ├─── 5. Status: 'resolved'
       │◄── Resolution Notes & Audit Log Dispatched ───────┤    (resolutionNotes, assetStateChange)
       │                                                   │
       │                                                   └─── 6. Status: 'closed'
```

---

## 4. Warranty Tracking & Expiry Alerts

1. **Active Warranty**: `Warranty.status = "active"`. `startDate` and `endDate` track policy coverage.
2. **Scheduled Alert Checks**: Compares `Date.now()` with `endDate`. When within alert threshold (30 days, 15 days, 1 day), creates a `Notification` for tenant managers with `type: "warranty_alert"`.
3. **Expired Warranty**: When `Date.now() > endDate`, status updates to `"expired"` and `type: "warranty_expiry"` notification is sent.

---

## 5. AI Health Scoring & Predictive Analytics

The `Asset.ai` subdocument stores intelligence metrics:
- **`healthScore`** (0–100): Calculated based on asset age vs `expectedLifespanMonths`, active repair ticket count, and maintenance history.
- **`failureRiskPercent`** (0–100%): Probability of critical failure within 90 days.
- **`remainingUsefulLifeMonths`**: Projected operational longevity.
- **`replacementRecommendation`**: `"keep"` | `"repair"` | `"replace"`.
