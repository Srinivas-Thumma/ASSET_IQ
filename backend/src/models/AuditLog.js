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
        "ticket_message_created",
        "return_initiated",
        "retirement_requested",
        "retirement_approved",
        "procurement_approved",
        "user_created",
        "user_updated",
        "user_deleted",
        "ai_health_analyzed"
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
      type: mongoose.Schema.Types.Mixed,
      default: {}
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

auditLogSchema.index({ organizationId: 1, createdAt: -1 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
