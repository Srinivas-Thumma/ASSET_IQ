import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
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
    name: {
      type: String,
      required: true,
      trim: true
    },
    contactEmail: {
      type: String,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

vendorSchema.index({ organizationId: 1, name: 1 }, { unique: true });

export const Vendor = mongoose.model("Vendor", vendorSchema);
export default Vendor;
