import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active"
    },
    planId: {
      type: String,
      default: "starter"
    },
    settings: {
      autoApproveThreshold: {
        type: Number,
        default: 2000
      },
      defaultTicketRouting: {
        hardware: {
          type: String,
          default: "asset_manager"
        },
        software: {
          type: String,
          default: "asset_manager"
        },
        network: {
          type: String,
          default: "asset_manager"
        }
      }
    }
  },
  {
    timestamps: true
  }
);

export const Organization = mongoose.model("Organization", organizationSchema);
export default Organization;
