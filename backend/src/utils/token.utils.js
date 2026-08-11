import jwt from "jsonwebtoken";
import {
  JWT_SECRET,
  JWT_EXPIRE,
  REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRE
} from "../config/env.js";

/**
 * Generate a short-lived access token JWT (15 minutes)
 * Accepts either (userId, email, role, organizationId) or ({ _id, email, role, organizationId })
 */
export const generateAccessToken = (userIdOrUser, emailArg, roleArg, organizationIdArg) => {
  let userId = userIdOrUser;
  let email = emailArg;
  let role = roleArg;
  let organizationId = organizationIdArg;

  if (typeof userIdOrUser === "object" && userIdOrUser !== null) {
    userId = userIdOrUser._id || userIdOrUser.id;
    email = userIdOrUser.email;
    role = userIdOrUser.role;
    organizationId = userIdOrUser.organizationId;
  }

  return jwt.sign(
    {
      _id: userId.toString(),
      email: email || undefined,
      role,
      organizationId: organizationId ? organizationId.toString() : null
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRE
    }
  );
};

/**
 * Generate a long-lived refresh token JWT (7 days)
 */
export const generateRefreshToken = (userId) => {
  const id = typeof userId === "object" && userId !== null ? userId._id || userId.id : userId;
  return jwt.sign(
    {
      _id: id.toString()
    },
    REFRESH_TOKEN_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRE
    }
  );
};

/**
 * Verify access token with JWT_SECRET
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Verify refresh token with REFRESH_TOKEN_SECRET
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
};

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
