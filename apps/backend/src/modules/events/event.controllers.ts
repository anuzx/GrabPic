import { asyncHandler } from "../../utils/asyncHandler";
import { prisma } from "db";
import { CreateEventSchema, JoinEventSchema } from "./event.schemas";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { generateEventCode } from "./event.helpers";

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
      photos: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!event) {
    throw new ApiError(404, "Event does not exist");
  }

  res.json(new ApiResponse(200, "event fetched", event));
});

export { createEvent, joinEvent, allEvents, getEventById };
