import { Router } from "express";
import {
  googleAuth,
  googleCallback,
  githubAuth,
  githubCallback,
} from "./auth.controller";

const router = Router();

router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);
router.post("/google/callback", googleCallback);
router.get("/github", githubAuth);
router.get("/github/callback", githubCallback);
router.post("/github/callback", githubCallback);

export default router;
