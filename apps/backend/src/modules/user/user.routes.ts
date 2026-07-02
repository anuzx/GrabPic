import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { getMe, logout } from "./user.controllers";

const router = Router();

router.get("/me", authenticate, getMe);
router.post("/logout", authenticate, logout);

export default router;
