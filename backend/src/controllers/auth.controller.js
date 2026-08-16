import bcrypt from "bcryptjs";
import { NODE_ENV } from "../config/env.js";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import Organization from "../models/Organization.js";
import RefreshToken from "../models/RefreshToken.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from "../utils/token.utils.js";

const isProduction = NODE_ENV === "production";

const accessTokenCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "strict" : "lax",
  maxAge: 15 * 60 * 1000 // 15 minutes
};

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "strict" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

const clearCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "strict" : "lax"
};

/**
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).populate("employeeRef");
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.status !== "active") {
    throw new ApiError(403, "Account is inactive. Please contact your administrator");
  }

  // If user belongs to an organization, verify the organization is active
  if (user.organizationId) {
    const org = await Organization.findById(user.organizationId);
    if (!org || org.status === "suspended" || org.status === "inactive") {
      throw new ApiError(403, "Your organization is inactive or suspended. Please contact support");
    }
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user._id);

  // Store refresh token in database (7 days validity)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    userId: user._id,
    token: refreshToken,
    expiresAt
  });

  // Set secure HttpOnly cookies
  res.cookie("accessToken", accessToken, accessTokenCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

  const employeeName = user.employeeRef
    ? `${user.employeeRef.firstName} ${user.employeeRef.lastName}`.trim()
    : undefined;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          _id: user._id,
          email: user.email,
          name: employeeName || user.email.split("@")[0],
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organizationName || ""
        }
      },
      "Login successful"
    )
  );
});

/**
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { email, password, name, fullName, firstName, lastName, organizationCode } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  // Parse names
  let fName = firstName || "";
  let lName = lastName || "";
  const combinedName = (name || fullName || "").trim();
  if (combinedName && !fName) {
    const parts = combinedName.split(" ");
    fName = parts[0] || "User";
    lName = parts.slice(1).join(" ") || "Member";
  }
  if (!fName) fName = normalizedEmail.split("@")[0];
  if (!lName) lName = "Member";

  let targetOrgId = null;
  let targetOrgName = "";
  let targetRole = "employee";

  if (organizationCode) {
    const matchedOrg = await Organization.findOne({
      $or: [
        { code: organizationCode.trim().toUpperCase() },
        { slug: organizationCode.trim().toLowerCase() }
      ]
    });

    if (!matchedOrg || matchedOrg.status !== "active") {
      throw new ApiError(404, "Organization with the specified code was not found or is inactive");
    }

    targetOrgId = matchedOrg._id;
    targetOrgName = matchedOrg.name;
    targetRole = "employee";
  } else {
    // In production, arbitrary public org creation is disallowed
    if (isProduction) {
      throw new ApiError(
        403,
        "Public organization registration is disabled in production. Organizations must be provisioned by a Super Administrator, or you must register with a valid Organization Code."
      );
    }

    // In development mode, allow creating a test organization for rapid local prototyping
    const orgName = `${fName}'s Organization`;
    const orgSlug = `${fName.toLowerCase().replace(/[^a-z0-9]/g, "")}-${Date.now().toString().slice(-4)}`;
    const newOrg = await Organization.create({
      name: orgName,
      code: orgSlug.toUpperCase(),
      slug: orgSlug,
      status: "active"
    });
    targetOrgId = newOrg._id;
    targetOrgName = newOrg.name;
    targetRole = "org_admin";
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create Employee profile
  const employee = await Employee.create({
    organizationId: targetOrgId,
    organizationName: targetOrgName,
    firstName: fName.trim(),
    lastName: lName.trim(),
    email: normalizedEmail,
    jobTitle: targetRole === "org_admin" ? "Organization Admin" : "Team Member",
    status: "active"
  });

  const user = await User.create({
    email: normalizedEmail,
    passwordHash,
    role: targetRole,
    organizationId: targetOrgId,
    organizationName: targetOrgName,
    employeeRef: employee._id,
    status: "active"
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user: {
          _id: user._id,
          email: user.email,
          name: `${fName} ${lName}`.trim(),
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organizationName,
          employeeRef: user.employeeRef,
          status: user.status
        }
      },
      "Account created successfully. Please sign in."
    )
  );
});

/**
 * POST /api/auth/refresh
 */
export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token missing from cookies");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const storedToken = await RefreshToken.findOne({ token: refreshToken });
  if (!storedToken) {
    throw new ApiError(401, "Refresh token has been revoked or expired");
  }

  const user = await User.findById(decoded._id);
  if (!user || user.status !== "active") {
    await RefreshToken.deleteOne({ token: refreshToken });
    throw new ApiError(401, "User no longer active or found");
  }

  // If user belongs to an organization, verify the organization is active
  if (user.organizationId) {
    const org = await Organization.findById(user.organizationId);
    if (!org || org.status === "suspended" || org.status === "inactive") {
      await RefreshToken.deleteOne({ token: refreshToken });
      throw new ApiError(403, "Your organization has been suspended or is inactive");
    }
  }

  const newAccessToken = generateAccessToken(user);

  res.cookie("accessToken", newAccessToken, accessTokenCookieOptions);

  return res.status(200).json(
    new ApiResponse(200, null, "Token refreshed")
  );
});

/**
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    await RefreshToken.deleteOne({ token: refreshToken });
  }

  res.clearCookie("accessToken", clearCookieOptions);
  res.clearCookie("refreshToken", clearCookieOptions);

  return res.status(200).json(
    new ApiResponse(200, null, "Logged out")
  );
});

/**
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-passwordHash")
    .populate("employeeRef");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.status !== "active") {
    throw new ApiError(403, "Account is inactive");
  }

  const employeeName = user.employeeRef
    ? `${user.employeeRef.firstName} ${user.employeeRef.lastName}`.trim()
    : user.email.split("@")[0];

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          _id: user._id,
          email: user.email,
          name: employeeName,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organizationName,
          employee: user.employeeRef,
          status: user.status
        }
      },
      "Current user profile"
    )
  );
});

export default {
  login,
  register,
  refresh,
  logout,
  getMe
};
