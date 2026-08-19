import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      index: true
    },
    type: {
      type: String,
      enum: [
        "ticket_claimed",
        "ticket_resolved",
        "asset_assigned",
        "return_initiated",
        "inspection_completed",
        "warranty_alert",
        "warranty_expiry",
        "admin_support_created",
        "admin_support_reply",
        "admin_support_status"
      ],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    read: {
      type: Boolean,
      default: false
    },
    daysRemaining: {
      type: Number,
      default: null
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    relatedType: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ organizationId: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
