import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    assetCode: {
      type: String,
      required: true,
      trim: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["stock", "assigned", "repair", "retired"],
      default: "stock",
      required: true
    },
    purchaseDate: {
      type: Date
    },
    purchasePrice: {
      type: Number
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: null
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null
    },
    qrCode: {
      type: String
    },
    ai: {
      healthScore: {
        type: Number
      },
      failureRiskPercent: {
        type: Number
      },
      remainingUsefulLifeMonths: {
        type: Number
      },
      predictedNextMaintenanceDate: {
        type: Date
      },
      lastAnalyzedAt: {
        type: Date
      },
      insights: [
        {
          type: String
        }
      ]
    },
    customValues: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: () => new Map()
    }
  },
  {
    timestamps: true
  }
);

assetSchema.index({ organizationId: 1, assetCode: 1 }, { unique: true });

export const Asset = mongoose.model("Asset", assetSchema);
export default Asset;
