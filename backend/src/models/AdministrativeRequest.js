import mongoose from "mongoose";

const administrativeRequestSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    organizationName: {
      type: String,
      trim: true,
      default: ""
    },
    requestCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    category: {
      type: String,
      enum: [
        "procurement",
        "plan_upgrade",
        "quota_increase",
        "billing",
        "platform_support",
        "other"
      ],
      required: true
    },
    status: {
      type: String,
      enum: [
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "completed"
      ],
      default: "submitted",
      required: true
    },
    priority: {
      type: String,
      enum: ["p1", "p2", "p3", "p4"],
      default: "p3"
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    assignedSuperAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    decisionNotes: {
      type: String,
      default: null
    },
    decidedAt: {
      type: Date,
      default: null
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true
  }
);

administrativeRequestSchema.index({ organizationId: 1, status: 1 });
administrativeRequestSchema.index({ organizationId: 1, category: 1 });
administrativeRequestSchema.index({ category: 1, status: 1 });
administrativeRequestSchema.index({ organizationId: 1, createdAt: -1 });

export const AdministrativeRequest = mongoose.model(
  "AdministrativeRequest",
  administrativeRequestSchema
);
export default AdministrativeRequest;
