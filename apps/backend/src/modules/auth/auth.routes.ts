import { Router } from "express";
import {
  googleAuth,
  googleCallback,
  githubAuth,
  githubCallback,
} from "./auth.controllers";

const router = Router();

router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);
router.get("/github", githubAuth);
router.get("/github/callback", githubCallback);

export default router;
