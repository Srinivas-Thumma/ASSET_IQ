import { Router } from "express";
import {
  login,
  register,
  refresh,
  logout,
  getMe
} from "../controllers/auth.controller.js";
import authenticate from "../middleware/auth.middleware.js";

import {
  authLimiter,
  registerLimiter,
  refreshLimiter
} from "../middleware/rateLimiter.middleware.js";

const router = Router();

router.post("/login", authLimiter, login);
router.post("/register", registerLimiter, register);
router.post("/refresh", refreshLimiter, refresh);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);

export default router;
