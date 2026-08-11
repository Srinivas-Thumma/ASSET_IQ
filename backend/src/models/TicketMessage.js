import mongoose from "mongoose";

const ticketMessageSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    senderName: {
      type: String,
      required: true,
      trim: true
    },
    senderRole: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    isInternal: {
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

export const TicketMessage = mongoose.model("TicketMessage", ticketMessageSchema);
export default TicketMessage;
