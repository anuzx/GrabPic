import { Router } from "express";
import {
  createEvent,
  joinEvent,
  allEvents,
  getEventById,
  getAllPhotos,
  removeEvent,
  leaveEvent,
  getSignedUrl,
  confirmPhotos,
  searchFace,
  downloadPhotos,
} from "./event.controllers";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.route("/").post(createEvent).get(allEvents).delete(removeEvent);

router.get("/join", joinEvent);
router.get("/:eventId", getEventById);
router.get("/:eventId/photos", getAllPhotos);
router.post("/:eventId/leave", leaveEvent);

router.get("/:eventId/signed-url", getSignedUrl);

router.post("/:eventId/photos/confirm", confirmPhotos);
router.post("/:eventId/photos/search-face", searchFace);
router.post("/:eventId/download" , downloadPhotos)
export default router;
