import { asyncHandler } from "../../utils/asyncHandler";
import { prisma } from "db";
import { CreateEventSchema, JoinEventSchema } from "./event.schemas";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { generateEventCode } from "./event.helpers";
import { cloudinary } from "../../config/cloudinary";
import { config } from "../../config/env";
import { redis } from "../../config/redis";
import { ZipArchive } from "archiver";
import { readFile, unlink } from "node:fs/promises";

const createEvent = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { data, success } = CreateEventSchema.safeParse(req.body);

  if (!success) {
    throw new ApiError(400, "invalid input");
  }

  const { title, description } = data;

  const code = generateEventCode();

  const event = await prisma.event.create({
    data: {
      title,
      description,
      createdById: userId,
      code,
      members: {
        create: {
          userId,
          role: "OWNER",
        },
      },
    },
  });

  return res.status(201).json(new ApiResponse(201, "event created", { event }));
});

const joinEvent = asyncHandler(async (req, res) => {
  const { success, data } = JoinEventSchema.safeParse(req.body);

  if (!success) {
    throw new ApiError(400, "Invalid code");
  }

  const { code } = data;

  const event = await prisma.event.findUnique({
    where: {
      code: code,
    },
  });

  if (!event) {
    throw new ApiError(404, "no such event exists");
  }

  const joined = await prisma.eventMember.findFirst({
    where: {
      eventId: event.id,
      userId: req.userId,
      role: "MEMBER",
    },
  });

  if (joined) {
    throw new ApiError(400, "Already a member");
  }

  const member = await prisma.eventMember.create({
    data: {
      eventId: event.id,
      userId: req.userId,
      role: "MEMBER",
    },
  });

  res.json(new ApiResponse(200, "User joined", member));
});

const allEvents = asyncHandler(async (req, res) => {
  const events = await prisma.eventMember.findMany({
    where: {
      userId: req.userId,
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          description: true,
          code: true,
        },
      },
    },
  });

  res.json(new ApiResponse(200, "events fetched", events));
});

const getEventById = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const membership = await prisma.eventMember.findUnique({
    where: {
      eventId_userId: {
        eventId: req.params.eventId as string,
        userId,
      },
    },
  });

  if (!membership) {
    throw new ApiError(403, "Not a member of this event");
  }

  const event = await prisma.event.findUnique({
    where: {
      id: req.params.eventId as string,
    },
    include: {
      _count: { select: { photos: true } },
      photos: {
        take: 20,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!event) {
    throw new ApiError(404, "Event does not exist");
  }

  res.json(new ApiResponse(200, "event fetched", event));
});

const getAllPhotos = asyncHandler(async (req, res) => {
  const cursor = req.query.cursor;
  const limit = 20;

  const membership = await prisma.eventMember.findUnique({
    where: {
      eventId_userId: {
        eventId: req.params.eventId as string,
        userId: req.userId,
      },
    },
  });

  if (!membership) throw new ApiError(403, "Not a member of this event");

  const photos = await prisma.photo.findMany({
    where: {
      eventId: req.params.eventId as string,
    },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor as string }, skip: 1 }),
    orderBy: { createdAt: "desc" },
  });

  const hasMore = photos.length > limit;
  const nextCursor = hasMore ? photos[photos.length - 1]!.id : null;
  if (hasMore) photos.pop();

  res.json({
    photos,
    nextCursor,
  });
});

const removeEvent = asyncHandler(async (req, res) => {
  const eventId = req.params.eventId as string;

  const membership = await prisma.eventMember.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId: req.userId,
      },
    },
  });

  if (!membership || membership.role !== "OWNER") {
    throw new ApiError(403, "Only the event owner can delete this event");
  }

  const photos = await prisma.photo.findMany({
    where: { eventId },
    select: { publicId: true },
  });

  await Promise.allSettled(
    photos.map((p) => cloudinary.uploader.destroy(p.publicId)),
  );

  await prisma.$executeRawUnsafe(
    "DELETE FROM face_embeddings WHERE event_id = $1",
    eventId,
  );

  await prisma.event.delete({
    where: { id: eventId },
  });

  res.json(new ApiResponse(200, "Event deleted successfully", null));
});

const leaveEvent = asyncHandler(async (req, res) => {
  const eventId = req.params.eventId! as string;
  const userId = req.userId;

  const membership = await prisma.eventMember.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
  });

  if (!membership) throw new ApiError(403, "Not a member of this event");

  if (membership.role === "OWNER") {
    throw new ApiError(403, "Event owner cannot leave the event");
  }

  await prisma.eventMember.delete({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
  });
  res.json(new ApiResponse(200, "Left event successfully", null));
});

const getSignedUrl = asyncHandler(async (req, res) => {
  const eventId = req.params.eventId! as string;
  const userId = req.userId;

  const membership = await prisma.eventMember.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new ApiError(403, "Only the event members can upload photos");
  }
  const timestamp = Math.round(Date.now() / 1000);
  const params = { timestamp, folder: `events/${eventId}` };
  const signature = cloudinary.utils.api_sign_request(
    params,
    config.cloudinaryApiSecret,
  );

  res.json({
    signature,
    timestamp,
    apiKey: config.cloudinaryApiKey,
    cloudName: config.cloudinaryCloudName,
    folder: `events/${eventId}`,
  });
});

/**
 * OWNER bulk push in db and send photoIds to ai-service for creating embeddings
 */
const confirmPhotos = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const eventId = req.params.eventId! as string;

  const membership = await prisma.eventMember.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
  });

  if (!membership || membership.role !== "OWNER") {
    throw new ApiError(403, "Only the event owner can upload photos");
  }

  //Validate body
  const { photos } = req.body; // [{ publicId, url, width, height }]
  if (!Array.isArray(photos) || photos.length === 0) {
    throw new ApiError(400, "No photos provided");
  }

  const created = await prisma.photo.createManyAndReturn({
    data: photos.map((p) => ({
      eventId,
      uploadedById: userId,
      url: p.url,
      publicId: p.publicId,
      width: p.width ?? null,
      height: p.height ?? null,
    })),
  });

  const photoIds = created.map((p) => p.id);

  //Push to Redis stream for AI processing
  //Stream: "photo:process"  Entry: { eventId, photoIds: JSON.stringify(photoIds) }
  await redis.xAdd(
    "photo:process",
    "*", // auto-generated ID
    {
      eventId,
      photoIds: JSON.stringify(photoIds),
    },
  );

  res.status(200).json(
    new ApiResponse(200, "Photos uploaded, processing queued", {
      count: photoIds.length,
    }),
  );
});

const searchFace = asyncHandler(async (req, res) => {
  const eventId = req.params.eventId! as string;
  const userId = req.userId;

  const membership = await prisma.eventMember.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });
  if (!membership) {
    throw new ApiError(403, "Not a member of this event");
  }

  const file = (req as any).file as
    | { buffer: Buffer; path: string }
    | undefined;
  if (!file) {
    throw new ApiError(400, "Selfie image is required");
  }

  const imageBuffer = file.buffer ?? (await readFile(file.path));

  try {
    const aiResp = await fetch(
      `${config.aiServiceUrl}/search-face?eventId=${eventId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: imageBuffer,
      },
    );

    if (!aiResp.ok) {
      throw new ApiError(502, "Face search failed");
    }

    const data = (await aiResp.json()) as { photoIds: string[] };
    const { photoIds } = data;

    const photos = await prisma.photo.findMany({
      where: { id: { in: photoIds }, eventId },
    });

    const ordered = photoIds
      .map((id: string) => photos.find((p) => p.id === id))
      .filter(Boolean) as typeof photos;

    res.json(new ApiResponse(200, "Photos found", { photos: ordered }));
  } finally {
    if (file.path) {
      unlink(file.path).catch(() => {});
    }
  }
});

const downloadPhotos = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const eventId = req.params.eventId! as string;

  const membership = await prisma.eventMember.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });
  if (!membership) throw new ApiError(403, "Not a member");

  const { photoIds } = req.body;
  if (!Array.isArray(photoIds) || photoIds.length === 0) {
    throw new ApiError(400, "photoIds is required");
  }

  const photos = await prisma.photo.findMany({
    where: { id: { in: photoIds }, eventId },
  });
  if (photos.length === 0) throw new ApiError(404, "No photos found");

  res.setHeader("Content-Type", "application/zip");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="event-${eventId}-photos.zip"`,
  );

  const archive = new ZipArchive({ zlib: { level: 5 } });

  //Error handler before pipe
  archive.on("error", () => {
    res.end();
  });

  archive.pipe(res);

  //Concurrent with chunking (10 at a time)
  const CHUNK_SIZE = 10;
  for (let i = 0; i < photos.length; i += CHUNK_SIZE) {
    const chunk = photos.slice(i, i + CHUNK_SIZE);
    const results = await Promise.allSettled(
      chunk.map(async (photo) => {
        const resp = await fetch(photo.url);
        if (!resp.ok) return null;
        return { id: photo.id, buffer: Buffer.from(await resp.arrayBuffer()) };
      }),
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        archive.append(r.value.buffer, { name: `${r.value.id}.jpg` });
      }
    }
  }

  await archive.finalize();
});

export {
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
};
