import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

departmentSchema.index({ organizationId: 1, code: 1 }, { unique: true });

export const Department = mongoose.model("Department", departmentSchema);
export default Department;
