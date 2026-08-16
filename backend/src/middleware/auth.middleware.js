import { verifyAccessToken } from "../utils/token.utils.js";
import ApiError from "../utils/ApiError.js";

export const authenticate = (req, res, next) => {
  try {
    let token = req.cookies?.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      throw new ApiError(401, "Unauthorized - Access token missing");
    }

    const decoded = verifyAccessToken(token);

    req.user = {
      _id: decoded._id,
      email: decoded.email,
      role: decoded.role,
      organizationId: decoded.organizationId,
      employeeRef: decoded.employeeRef || null
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    return next(new ApiError(401, "Unauthorized - Invalid or expired access token"));
  }
};

export default authenticate;
