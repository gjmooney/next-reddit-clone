import { type } from "os";
import { z } from "zod";

// zod schema
export const PostValidator = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be longer than 3 characters" })
    .max(128, "Title cannot be longer than 128 characters"),
  subredditId: z.string(),
  content: z.any(),
});

export type PostCreationRequest = z.infer<typeof PostValidator>;
