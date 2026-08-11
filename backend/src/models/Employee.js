import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null
    },
    jobTitle: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ["active", "offboarded"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

export const Employee = mongoose.model("Employee", employeeSchema);
export default Employee;
