import mongoose from "mongoose";
import { MONGODB_URI } from "./env.js";
import logger from "./logger.js";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`, error);
    process.exit(1);
  }
};

export default connectDB;
