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
    level: {
      type: Number,
      enum: [1, 2, 3],
      default: 1
    },
    address: {
      type: String,
      trim: true,
      default: ""
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

locationSchema.index({ organizationId: 1, code: 1 }, { unique: true });

export const Location = mongoose.model("Location", locationSchema);
export default Location;
