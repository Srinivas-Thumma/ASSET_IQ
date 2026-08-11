import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["branch", "building", "floor", "room", "zone"],
      required: true
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null
    },
    path: {
      type: String,
      default: ""
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

locationSchema.index({ organizationId: 1, code: 1 }, { unique: true });

export const Location = mongoose.model("Location", locationSchema);
export default Location;
