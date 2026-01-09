import { z } from "zod";

export const LIMITS = {
  EXPERIENCE_MIN_LENGTH: 50,
  EXPERIENCE_MAX_LENGTH: 2000,
  EXPERIENCES_PER_PAGE: 20,
  MAX_EXPERIENCES_PER_HOUR: 5,
};

export const SORT_OPTIONS = {
  LATEST: "latest",
  OLDEST: "oldest",
  MOST_VIEWED: "most_viewed",
};

export const experienceContentSchema = z
  .string({
    required_error: "Content is required",
    invalid_type_error: "Content must be text",
  })
  .min(
    LIMITS.EXPERIENCE_MIN_LENGTH,
    `Experience must be at least ${LIMITS.EXPERIENCE_MIN_LENGTH} characters`
  )
  .max(
    LIMITS.EXPERIENCE_MAX_LENGTH,
    `Experience must not exceed ${LIMITS.EXPERIENCE_MAX_LENGTH} characters`
  )
  .transform((val) => val.trim());

export const createExperienceSchema = z.object({
  content: experienceContentSchema,
});

export const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(LIMITS.EXPERIENCES_PER_PAGE),
  search: z.string().max(100).optional(),
  sort: z
    .enum([SORT_OPTIONS.LATEST, SORT_OPTIONS.OLDEST, SORT_OPTIONS.MOST_VIEWED])
    .default(SORT_OPTIONS.LATEST),
});

export default {
  experienceContentSchema,
  createExperienceSchema,
  querySchema,
  LIMITS,
  SORT_OPTIONS,
};
