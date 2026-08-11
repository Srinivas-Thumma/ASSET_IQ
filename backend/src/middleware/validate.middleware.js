import { ZodError } from "zod";
import ApiError from "../utils/ApiError.js";

export const validate = (schema) => (req, res, next) => {
  try {
    const parsedData = schema.parse(req.body);
    req.body = parsedData;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const zodErrors = error.issues
        ? error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message
          }))
        : error.errors?.map((err) => ({
            field: err.path.join("."),
            message: err.message
          })) || [];
      return next(new ApiError(400, "Validation failed", zodErrors));
    }
    return next(error);
  }
};

export default validate;
