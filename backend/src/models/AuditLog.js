import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    actorRole: {
      type: String,
      required: true
    },
    action: {
      type: String,
      enum: [
        "asset_created",
        "asset_state_change",
        "assignment_created",
        "assignment_returned",
        "inspection_completed",
        "ticket_created",
        "ticket_claimed",
        "ticket_resolved",
        "ticket_escalated",
        "return_initiated",
        "retirement_requested",
        "retirement_approved",
        "procurement_approved"
      ],
      required: true,
      index: true
    },
    targetType: {
      type: String,
      enum: ["asset", "ticket", "assignment", "user"],
      required: true,
      index: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    metadata: {
      from: {
        type: String,
        default: null
      },
      to: {
        type: String,
        default: null
      },
      reason: {
        type: String,
        default: null
      },
      ticketType: {
        type: String,
        default: null
      },
      inspectionResult: {
        type: String,
        default: null
      }
    },
    createdAt: {
      type: Date,
      default: Date.now,
      required: true,
      immutable: true
    }
  },
  {
    timestamps: false
  }
);

// Enforce append-only constraint on AuditLog collection
auditLogSchema.pre(["updateOne", "updateMany", "findOneAndUpdate", "replaceOne"], function () {
  throw new Error("AuditLog is append-only: updates are prohibited");
});

auditLogSchema.pre(["deleteOne", "deleteMany", "findOneAndDelete"], function () {
  throw new Error("AuditLog is append-only: deletions are prohibited");
});

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
