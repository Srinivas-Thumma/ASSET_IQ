import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
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
    expectedLifespanMonths: {
      type: Number,
      default: 36
    }
  },
  {
    timestamps: true
  }
);

categorySchema.index({ organizationId: 1, name: 1 }, { unique: true });

export const Category = mongoose.model("Category", categorySchema);
export default Category;
