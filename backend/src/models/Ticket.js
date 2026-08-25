import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      trim: true,
      index: true
    },
    ticketCode: {
      type: String,
      trim: true,
      index: true
    },
    type: {
      type: String,
      enum: ["repair", "request", "return", "support", "admin_support"],
      required: true
    },
    status: {
      type: String,
      enum: ["open", "claimed", "in_progress", "resolved", "closed"],
      default: "open",
      required: true
    },
    priority: {
      type: String,
      enum: ["p1", "p2", "p3", "p4", null],
      default: null,
      required: false
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      default: null
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null
    },
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      default: null
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    handler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    issueType: {
      type: String,
      enum: ["hardware", "software", "network", "accessory", "billing", "plan_upgrade", "policy", "technical", "other"],
      default: "hardware"
    },
    estimatedCost: {
      type: Number,
      default: 0
    },
    vendorName: {
      type: String,
      default: null
    },
    scheduledDate: {
      type: Date,
      default: null
    },
    resolutionNotes: {
      type: String,
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    assetStateChange: {
      from: {
        type: String,
        default: null
      },
      to: {
        type: String,
        default: null
      },
      changedAt: {
        type: Date,
        default: null
      }
    },
    isEscalated: {
      type: Boolean,
      default: false
    },
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
    }
  },
  {
    timestamps: true
  }
);

ticketSchema.index({ organizationId: 1, status: 1 });
ticketSchema.index({ organizationId: 1, raisedBy: 1 });
ticketSchema.index({ organizationId: 1, handler: 1 });
ticketSchema.index({ organizationId: 1, createdAt: -1 });
ticketSchema.index({ assetId: 1, organizationId: 1 });

export const Ticket = mongoose.model("Ticket", ticketSchema);
export default Ticket;
