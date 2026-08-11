import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["repair", "request", "return", "support"],
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
      enum: ["p1", "p2", "p3", "p4"],
      default: "p3",
      required: true
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
      enum: ["hardware", "software", "network", "accessory", "other"],
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
    }
  },
  {
    timestamps: true
  }
);

export const Ticket = mongoose.model("Ticket", ticketSchema);
export default Ticket;
