# 02 — Data Flow and Storage Guide

## 1. Mongoose Database Models & Schemas

AssetOwl uses 16 Mongoose models in `backend/src/models/`.

```
                  ┌────────────────────┐
                  │    Organization    │
                  └─────────┬──────────┘
                            │ 1:N
       ┌────────────────────┼────────────────────┬────────────────────┐
       ▼                    ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Department  │     │   Category   │     │   Location   │     │    Vendor    │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │                    │
       │ 1:N                │ 1:N                │ 1:N                │ 1:N
       ▼                    ▼                    ▼                    ▼
┌──────────────┐     ┌────────────────────────────────────────────────────────┐
│   Employee   │     │                         Asset                          │
└──────┬───────┘     └───────────┬────────────────────────────┬───────────────┘
       │                         │ 1:N                        │ 1:N
       │ 1:N                     ▼                            ▼
       │                  ┌──────────────┐             ┌──────────────┐
       │                  │   Warranty   │             │  Assignment  │
       │                  └──────────────┘             └──────┬───────┘
       ▼                                                      │
┌──────────────┐                                              │
│     User     │◄─────────────────────────────────────────────┘
└──────┬───────┘
       │ 1:N
       ├─────────────────────────┬─────────────────────────┐
       ▼                         ▼                         ▼
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│    Ticket    │◄─────────┤ TicketMessage│          │ Notification │
└──────────────┘          └──────────────┘          └──────────────┘
```

---

## 2. Complete Model Dictionary

### 1. `Organization` (`Organization.js`)
- **Fields**:
  - `name`: `String` (required, trim)
  - `slug`: `String` (required, unique, lowercase, trim)
  - `code`: `String` (unique, sparse, uppercase, trim)
  - `status`: `String` (`enum: ["active", "suspended"]`, default: `"active"`)
  - `planId`: `String` (default: `"starter"`)
  - `settings`: Subdocument (`autoApproveThreshold`, `defaultTicketRouting`)
- **Indexes**: `{ slug: 1 }` (unique), `{ code: 1 }` (unique, sparse).

### 2. `User` (`User.js`)
- **Fields**:
  - `email`: `String` (required, unique, lowercase, trim)
  - `passwordHash`: `String` (required, bcrypt hash)
  - `role`: `String` (`enum: ["super_admin", "org_admin", "asset_manager", "employee"]`, required)
  - `employeeRef`: `ObjectId` (ref: `Employee`, default: `null`)
  - `organizationId`: `ObjectId` (ref: `Organization`, indexed, default: `null` for Super Admin)
  - `organizationName`: `String` (default: `""`)
  - `status`: `String` (`enum: ["active", "inactive"]`, default: `"active"`)
- **Indexes**: `{ email: 1 }` (unique), `{ organizationId: 1 }`.

### 3. `Employee` (`Employee.js`)
- **Fields**:
  - `organizationId`: `ObjectId` (ref: `Organization`, required, indexed)
  - `organizationName`: `String` (default: `""`)
  - `firstName`: `String` (required, trim)
  - `lastName`: `String` (required, trim)
  - `email`: `String` (required, lowercase, trim)
  - `departmentId`: `ObjectId` (ref: `Department`, default: `null`)
  - `jobTitle`: `String` (trim)
  - `status`: `String` (`enum: ["active", "offboarded"]`, default: `"active"`)
- **Indexes**: `{ organizationId: 1 }`.

### 4. `Department` (`Department.js`)
- **Fields**:
  - `organizationId`: `ObjectId` (ref: `Organization`, required, indexed)
  - `organizationName`: `String` (default: `""`)
  - `name`: `String` (required, trim)
  - `code`: `String` (required, trim)
- **Indexes**: `{ organizationId: 1, code: 1 }` (unique).

### 5. `Category` (`Category.js`)
- **Fields**:
  - `organizationId`: `ObjectId` (ref: `Organization`, required, indexed)
  - `organizationName`: `String` (default: `""`)
  - `name`: `String` (required, trim)
  - `expectedLifespanMonths`: `Number` (default: 36)
- **Indexes**: `{ organizationId: 1, name: 1 }` (unique).

### 6. `Location` (`Location.js`)
- **Fields**:
  - `name`: `String` (required, trim)
  - `code`: `String` (required, trim)
  - `type`: `String` (`enum: ["branch", "building", "floor", "room", "zone"]`, required)
  - `level`: `Number` (`enum: [1, 2, 3]`, default: 1)
  - `address`: `String` (default: `""`)
  - `parentId`: `ObjectId` (ref: `Location`, default: `null`)
  - `path`: `String` (materialized hierarchy path, e.g. `"/HQ/HQ-MB"`)
  - `organizationId`: `ObjectId` (ref: `Organization`, required, indexed)
  - `organizationName`: `String` (default: `""`)
- **Indexes**: `{ organizationId: 1, code: 1 }` (unique).

### 7. `Vendor` (`Vendor.js`)
- **Fields**:
  - `organizationId`: `ObjectId` (ref: `Organization`, required, indexed)
  - `organizationName`: `String` (default: `""`)
  - `name`: `String` (required, trim)
  - `contactEmail`: `String` (lowercase, trim)
  - `phone`: `String` (trim)
- **Indexes**: `{ organizationId: 1, name: 1 }` (unique).

### 8. `Asset` (`Asset.js`)
- **Fields**:
  - `name`: `String` (required, trim)
  - `assetCode`: `String` (required, trim)
  - `imageUrl`: `String` (default: `null`)
  - `categoryId`: `ObjectId` (ref: `Category`, default: `null`)
  - `organizationId`: `ObjectId` (ref: `Organization`, required, indexed)
  - `organizationName`: `String` (default: `""`)
  - `status`: `String` (`enum: ["stock", "assigned", "repair", "retired"]`, default: `"stock"`, required)
  - `purchaseDate`: `Date`
  - `purchasePrice`: `Number`
  - `warrantyEndDate`: `Date`
  - `warrantyType`: `String` (`enum: ["manufacturer", "extended", "third_party", "none"]`, default: `"manufacturer"`)
  - `expectedLifespanMonths`: `Number` (default: 36)
  - `vendorId`: `ObjectId` (ref: `Vendor`, default: `null`)
  - `locationId`: `ObjectId` (ref: `Location`, default: `null`)
  - `qrCode`: `String`
  - `ai`: Subdocument (`healthScore`, `failureRiskPercent`, `remainingUsefulLifeMonths`, `predictedNextMaintenanceDate`, `replacementRecommendation: ["keep", "repair", "replace"]`, `insights: [String]`)
  - `healthHistory`: Array of `{ score: Number, date: Date }`
  - `customValues`: Map of Mixed
- **Indexes**: `{ organizationId: 1, assetCode: 1 }` (unique).

### 9. `Assignment` (`Assignment.js`)
- **Fields**:
  - `assetId`: `ObjectId` (ref: `Asset`, required, indexed)
  - `employeeId`: `ObjectId` (ref: `Employee`, required, indexed)
  - `assignedBy`: `ObjectId` (ref: `User`, required)
  - `assignedAt`: `Date` (default: `Date.now`, required)
  - `returnInitiatedAt`: `Date` (default: `null`)
  - `returnInitiatedBy`: `ObjectId` (ref: `User`, default: `null`)
  - `returnReason`: `String` (`enum: ["offboarding", "upgrade", "defective"]`, default: `null`)
  - `inspectedAt`: `Date` (default: `null`)
  - `inspectedBy`: `ObjectId` (ref: `User`, default: `null`)
  - `inspectionResult`: `String` (`enum: ["pass", "fail_repair", "fail_retire"]`, default: `null`)
  - `inspectionNotes`: `String` (default: `null`)
  - `returnedAt`: `Date` (default: `null`)
  - `organizationId`: `ObjectId` (ref: `Organization`, required, indexed)
  - `organizationName`: `String` (default: `""`)

### 10. `Ticket` (`Ticket.js`)
- **Fields**:
  - `type`: `String` (`enum: ["repair", "request", "return", "support", "admin_support"]`, required)
  - `status`: `String` (`enum: ["open", "claimed", "in_progress", "resolved", "closed"]`, default: `"open"`, required)
  - `priority`: `String` (`enum: ["p1", "p2", "p3", "p4", null]`, default: `null`)
  - `assetId`: `ObjectId` (ref: `Asset`, default: `null`)
  - `categoryId`: `ObjectId` (ref: `Category`, default: `null`)
  - `assignmentId`: `ObjectId` (ref: `Assignment`, default: `null`)
  - `raisedBy`: `ObjectId` (ref: `User`, required)
  - `handler`: `ObjectId` (ref: `User`, default: `null`)
  - `title`: `String` (required, trim)
  - `description`: `String` (required)
  - `issueType`: `String` (`enum: ["hardware", "software", "network", "accessory", "billing", "plan_upgrade", "policy", "technical", "other"]`, default: `"hardware"`)
  - `estimatedCost`: `Number` (default: 0)
  - `vendorName`: `String` (default: `null`)
  - `scheduledDate`: `Date` (default: `null`)
  - `resolutionNotes`: `String` (default: `null`)
  - `resolvedAt`: `Date` (default: `null`)
  - `resolvedBy`: `ObjectId` (ref: `User`, default: `null`)
  - `assetStateChange`: Subdocument (`from`, `to`, `changedAt`)
  - `isEscalated`: `Boolean` (default: `false`)
  - `organizationId`: `ObjectId` (ref: `Organization`, required, indexed)
  - `organizationName`: `String` (default: `""`)

### 11. `TicketMessage` (`TicketMessage.js`)
- **Fields**:
  - `ticketId`: `ObjectId` (ref: `Ticket`, required, indexed)
  - `senderId`: `ObjectId` (ref: `User`, required)
  - `senderName`: `String` (required, trim)
  - `senderRole`: `String` (required)
  - `message`: `String` (required)
  - `isInternal`: `Boolean` (default: `false`)
  - `isSystemMessage`: `Boolean` (default: `false`)
  - `organizationId`: `ObjectId` (ref: `Organization`, required, indexed)

### 12. `Warranty` (`Warranty.js`)
- **Fields**:
  - `organizationId`: `ObjectId` (ref: `Organization`, required, indexed)
  - `assetId`: `ObjectId` (ref: `Asset`, required, indexed)
  - `provider`: `String` (required, trim)
  - `policyNumber`: `String` (required, trim)
  - `startDate`: `Date` (required)
  - `endDate`: `Date` (required)
  - `status`: `String` (`enum: ["active", "expired", "alerted"]`, default: `"active"`)
  - `alertSent`: `Boolean` (default: `false`)

### 13. `Notification` (`Notification.js`)
- **Fields**:
  - `userId`: `ObjectId` (ref: `User`, required, indexed)
  - `organizationId`: `ObjectId` (ref: `Organization`, indexed)
  - `type`: `String` (`enum: ["ticket_claimed", "ticket_resolved", "asset_assigned", "return_initiated", "inspection_completed", "warranty_alert", "warranty_expiry"]`, required)
  - `title`: `String` (required)
  - `message`: `String` (required)
  - `read`: `Boolean` (default: `false`)
  - `daysRemaining`: `Number` (default: `null`)
  - `relatedId`: `ObjectId` (default: `null`)
  - `relatedType`: `String` (default: `null`)

### 14. `AuditLog` (`AuditLog.js`)
- **Fields**:
  - `organizationId`: `ObjectId` (ref: `Organization`, required, indexed)
  - `actorId`: `ObjectId` (ref: `User`, required, indexed)
  - `actorRole`: `String` (required)
  - `action`: `String` (`enum: ["asset_created", "asset_state_change", "assignment_created", "assignment_returned", "inspection_completed", "ticket_created", "ticket_claimed", "ticket_resolved", "ticket_escalated", "return_initiated", "retirement_requested", "retirement_approved", "procurement_approved", "user_created", "user_updated", "user_deleted", "ai_health_analyzed"]`, required, indexed)
  - `targetType`: `String` (`enum: ["asset", "ticket", "assignment", "user"]`, required, indexed)
  - `targetId`: `ObjectId` (required, indexed)
  - `metadata`: `Mixed` (default: `{}`)
  - `createdAt`: `Date` (default: `Date.now`, required, `immutable: true`)
- **Append-Only Constraint**: Hooks on `updateOne`, `updateMany`, `findOneAndUpdate`, `replaceOne`, `deleteOne`, `deleteMany`, and `findOneAndDelete` throw errors prohibiting modification or deletion.

### 15. `Plan` (`Plan.js`)
- **Fields**:
  - `name`: `String` (required, trim)
  - `slug`: `String` (required, unique, lowercase, trim)
  - `price`: `Number` (required, default: 0)
  - `maxAssets`: `Number` (required, default: 100)
  - `maxEmployees`: `Number` (required, default: 50)
  - `features`: Array of `String`

### 16. `RefreshToken` (`RefreshToken.js`)
- **Fields**:
  - `userId`: `ObjectId` (ref: `User`, required, indexed)
  - `token`: `String` (required, unique)
  - `expiresAt`: `Date` (required, index with TTL: `{ expires: "0s" }`)
  - `createdAt`: `Date` (default: `Date.now`)
