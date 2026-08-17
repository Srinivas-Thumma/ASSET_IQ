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
    imageUrl: {
      type: String,
      default: null
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
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
    warrantyEndDate: {
      type: Date
    },
    warrantyType: {
      type: String,
      enum: ["manufacturer", "extended", "third_party", "none"],
      default: "manufacturer"
    },
    warrantyDocUrl: {
      type: String,
      default: null
    },
    warrantyAlertsSent: [
      {
        type: String // e.g. "30d", "15d", "1d", "expired"
      }
    ],
    expectedLifespanMonths: {
      type: Number,
      default: 36
    },
    expectedRetirementDate: {
      type: Date
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
        type: Number,
        default: null
      },
      failureRiskPercent: {
        type: Number,
        default: null
      },
      remainingUsefulLifeMonths: {
        type: Number,
        default: null
      },
      predictedNextMaintenanceDate: {
        type: Date,
        default: null
      },
      lastAnalyzedAt: {
        type: Date,
        default: null
      },
      replacementRecommendation: {
        type: String,
        enum: ["keep", "repair", "replace"],
        default: "keep"
      },
      insights: [
        {
          type: String
        }
      ]
    },
    healthHistory: [
      {
        score: { type: Number, required: true },
        date: { type: Date, default: Date.now }
      }
    ],
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
assetSchema.index({ organizationId: 1, status: 1 });
assetSchema.index({ organizationId: 1, createdAt: -1 });
assetSchema.index({ organizationId: 1, categoryId: 1 });
assetSchema.index({ warrantyEndDate: 1, status: 1 });

export const Asset = mongoose.model("Asset", assetSchema);
export default Asset;
