import dotenv from "dotenv";

dotenv.config({ quiet: true });

export const PORT = process.env.PORT || 5000;
export const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/assetiq_v2";
export const JWT_SECRET = process.env.JWT_SECRET || "change-this-access-token-secret";
export const JWT_EXPIRE = process.env.JWT_EXPIRE || "15m";
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "change-this-refresh-token-secret-different-from-jwt";
export const REFRESH_TOKEN_EXPIRE = process.env.REFRESH_TOKEN_EXPIRE || "7d";
export const NODE_ENV = process.env.NODE_ENV || "development";

export default {
  PORT,
  MONGODB_URI,
  JWT_SECRET,
  JWT_EXPIRE,
  REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRE,
  NODE_ENV
};
