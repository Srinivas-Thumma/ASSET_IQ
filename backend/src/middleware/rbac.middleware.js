import ApiError from "../utils/ApiError.js";

export const requireRole = (roles) => (req, res, next) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  if (!req.user || !allowedRoles.includes(req.user.role)) {
    throw new ApiError(403, "Access denied");
  }

  next();
};

export default requireRole;
