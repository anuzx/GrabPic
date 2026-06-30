import { Router } from "express";
import {
  googleAuth,
  googleCallback,
  getMe,
  logout,
} from "./auth.controller";
import { authenticate } from "./auth.middleware";

const router = Router();

router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);
router.get("/me", authenticate, getMe);
router.post("/logout", authenticate, logout);

export default router;
