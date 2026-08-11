import mongoose from "mongoose";

const warrantySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
      index: true
    },
    provider: {
      type: String,
      required: true,
      trim: true
    },
    policyNumber: {
      type: String,
      required: true,
      trim: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["active", "expired", "alerted"],
      default: "active"
    },
    alertSent: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export const Warranty = mongoose.model("Warranty", warrantySchema);
export default Warranty;
