import { z } from "zod";

export const CreateEventSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});

export const JoinEventSchema = z.object({
  code: z.string().length(6),
});
