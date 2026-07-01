import { Router } from "express";
import {
  createEvent,
  joinEvent,
  allEvents,
  getEventById,
} from "./event.controller";
import { authenticate } from "../auth/auth.middleware";

const router = Router();

router.use(authenticate);

router.route("/").post(createEvent).get(allEvents);
router.get("/join", joinEvent);
router.get("/:eventId", getEventById);

export default router;
