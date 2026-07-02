import { Router } from "express";
import {
  createEvent,
  joinEvent,
  allEvents,
  getEventById,
  getAllPhotos,
  removeEvent,
  leaveEvent
} from "./event.controllers";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.route("/")
  .post(createEvent)
  .get(allEvents)
  .delete(removeEvent);

router.get("/join", joinEvent);
router.get("/:eventId", getEventById);
router.get("/:eventId/photos", getAllPhotos);
router.post("/:eventId/leave", leaveEvent)
export default router;
