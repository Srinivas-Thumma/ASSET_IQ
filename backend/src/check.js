import {
  PORT,
  MONGODB_URI,
  JWT_SECRET,
  JWT_EXPIRE,
  REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRE,
  NODE_ENV
} from "./config/env.js";
import logger from "./config/logger.js";
import ApiError from "./utils/ApiError.js";
import ApiResponse from "./utils/ApiResponse.js";
import asyncHandler from "./utils/asyncHandler.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
} from "./utils/token.utils.js";
import authenticate from "./middleware/auth.middleware.js";
import requireRole from "./middleware/rbac.middleware.js";
import validate from "./middleware/validate.middleware.js";
import errorHandler from "./middleware/error.middleware.js";

import User from "./models/User.js";
import Employee from "./models/Employee.js";
import Organization from "./models/Organization.js";
import Department from "./models/Department.js";
import Category from "./models/Category.js";
import Asset from "./models/Asset.js";
import Assignment from "./models/Assignment.js";
import Ticket from "./models/Ticket.js";
import TicketMessage from "./models/TicketMessage.js";
import Location from "./models/Location.js";
import Vendor from "./models/Vendor.js";
import Warranty from "./models/Warranty.js";
import AuditLog from "./models/AuditLog.js";
import RefreshToken from "./models/RefreshToken.js";

import authRoutes from "./routes/auth.routes.js";
import authController from "./controllers/auth.controller.js";
import app from "./app.js";

console.log("=== AssetIQ v2 HttpOnly Cookie Auth Backend Check ===");
console.log("Config loaded:", {
  PORT,
  MONGODB_URI,
  JWT_EXPIRE,
  REFRESH_TOKEN_EXPIRE,
  NODE_ENV
});

// Test token generation and verification
const mockUserId = "64b0f2a99e8b7c001f9d5e12";
const mockOrgId = "64b0f2a99e8b7c001f9d5e11";
const accessToken = generateAccessToken(mockUserId, "admin@assetiq.com", "org_admin", mockOrgId);
const refreshToken = generateRefreshToken(mockUserId);

const decodedAccess = verifyAccessToken(accessToken);
const decodedRefresh = verifyRefreshToken(refreshToken);

if (decodedAccess._id !== mockUserId || decodedAccess.role !== "org_admin") {
  throw new Error("Access token verification mismatch");
}

if (decodedRefresh._id !== mockUserId) {
  throw new Error("Refresh token verification mismatch");
}
console.log("Token generation and verification: PASSED");

console.log("All 14 Models verified:", [
  User.modelName,
  Employee.modelName,
  Organization.modelName,
  Department.modelName,
  Category.modelName,
  Asset.modelName,
  Assignment.modelName,
  Ticket.modelName,
  TicketMessage.modelName,
  Location.modelName,
  Vendor.modelName,
  Warranty.modelName,
  AuditLog.modelName,
  RefreshToken.modelName
].join(", "));

console.log("Express App & Auth Routes instantiated successfully.");
console.log("ALL BACKEND CHECKS PASSED!");
process.exit(0);
