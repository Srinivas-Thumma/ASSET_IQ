import mongoose from "mongoose";
import logger from "../config/logger.js";
import ApiError from "../utils/ApiError.js";

export const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    if (error instanceof mongoose.Error.CastError) {
      error = new ApiError(400, "Invalid ID", [
        { field: error.path, message: `Invalid ${error.path}: ${error.value}` }
      ]);
    } else if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors || {}).map((val) => ({
        field: val.path,
        message: val.message
      }));
      error = new ApiError(400, "Validation Error", validationErrors);
    } else {
      const statusCode = error.statusCode || 500;
      const message = statusCode === 500 ? "Internal server error" : error.message || "Internal server error";
      error = new ApiError(statusCode, message, error.errors || []);
    }
  }

  logger.error(
    `${error.statusCode || 500} - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
    {
      stack: err.stack,
      errors: error.errors
    }
  );

  return res.status(error.statusCode || 500).json({
    success: false,
    statusCode: error.statusCode || 500,
    message: error.message,
    errors: error.errors || []
  });
};

export default errorHandler;
