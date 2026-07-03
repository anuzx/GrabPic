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
import { upload } from "../../middlewares/multer.middleware";
import {
  defineBucket,
  tokenBucketRateLimiter,
} from "../../middlewares/rate-limiter/upload-rate-limiter.middleware";
import type { Request } from "express";

defineBucket("photoUpload", {
  maxTokens: 250,
  refillRate: 25,
  refillIntervalMs: 1000,
  getTokenCost: (req: Request) => {
    const photos = req.body?.photos;
    return Array.isArray(photos) ? photos.length : 1;
  },
});

defineBucket("faceSearch", {
  maxTokens: 5,
  refillRate: 5,
  refillIntervalMs: 1000,
  getTokenCost: () => 1,
});

const router = Router();

router.use(authenticate);

router.post("/", createEvent);
router.get("/", allEvents);

router.post("/join", joinEvent);
router.get("/:eventId", getEventById);
router.get("/:eventId/photos", getAllPhotos);
router.post("/:eventId/leave", leaveEvent);
router.delete("/:eventId", removeEvent);

router.get("/:eventId/signed-url", getSignedUrl);

router.post(
  "/:eventId/photos/confirm",
  tokenBucketRateLimiter("photoUpload"),
  confirmPhotos,
);
router.post(
  "/:eventId/photos/search-face",
  upload.single("selfie"),
  tokenBucketRateLimiter("faceSearch"),
  searchFace,
);
router.post("/:eventId/download", downloadPhotos);
export default router;
