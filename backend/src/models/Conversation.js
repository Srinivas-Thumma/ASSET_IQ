import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    contextType: {
      type: String,
      enum: ["ticket", "request", "organization"],
      required: true
    },
    contextId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    lastMessageAt: {
      type: Date,
      default: Date.now
    },
    lastMessageSnippet: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

// General Query Indexes
conversationSchema.index({ participants: 1, lastMessageAt: -1 });

// Partial Unique Indexes for Context Uniqueness Rules
// 1. Each Ticket has at most one ticket Conversation
conversationSchema.index(
  { contextType: 1, contextId: 1 },
  {
    name: "idx_unique_ticket_conversation",
    unique: true,
    partialFilterExpression: {
      contextType: "ticket",
      contextId: { $type: "objectId" }
    }
  }
);

// 2. Each AdministrativeRequest has at most one request Conversation
conversationSchema.index(
  { contextType: 1, contextId: 1 },
  {
    name: "idx_unique_request_conversation",
    unique: true,
    partialFilterExpression: {
      contextType: "request",
      contextId: { $type: "objectId" }
    }
  }
);

// 3. Each Organization has at most one organization Conversation
conversationSchema.index(
  { organizationId: 1, contextType: 1 },
  {
    name: "idx_unique_organization_conversation",
    unique: true,
    partialFilterExpression: {
      contextType: "organization"
    }
  }
);

export const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
