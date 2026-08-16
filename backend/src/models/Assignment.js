import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
      index: true
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    assignedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    returnInitiatedAt: {
      type: Date,
      default: null
    },
    returnInitiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    returnReason: {
      type: String,
      enum: ["offboarding", "upgrade", "defective"],
      default: null
    },
    inspectedAt: {
      type: Date,
      default: null
    },
    inspectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    inspectionResult: {
      type: String,
      enum: ["pass", "fail_repair", "fail_retire"],
      default: null
    },
    inspectionNotes: {
      type: String,
      default: null
    },
    returnedAt: {
      type: Date,
      default: null
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

assignmentSchema.index({ organizationId: 1, employeeId: 1, returnedAt: 1 });
assignmentSchema.index({ organizationId: 1, assetId: 1, returnedAt: 1 });
assignmentSchema.index({ organizationId: 1, returnInitiatedAt: 1, returnedAt: 1 });

export const Assignment = mongoose.model("Assignment", assignmentSchema);
export default Assignment;
