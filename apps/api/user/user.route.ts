import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import { getMe, logout } from "./user.controller";

const router = Router();

router.get("/me", authenticate, getMe);
router.post("/logout", authenticate, logout);
// router.post("/event");
// router.get("/event/:eventId");

export default router;
