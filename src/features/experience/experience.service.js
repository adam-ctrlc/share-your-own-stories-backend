import prisma from "../../common/libs/prisma.js";
import { sanitizeText, hashIP } from "../../common/utils/sanitize.js";
import {
  experienceContentSchema,
  querySchema,
  LIMITS,
  SORT_OPTIONS,
} from "../../common/utils/schemas.js";
import Fuse from "fuse.js";

export async function createExperience(content, ip) {
  const validation = experienceContentSchema.safeParse(content);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Invalid content",
    };
  }

  const sanitizedContent = sanitizeText(
    validation.data,
    LIMITS.EXPERIENCE_MAX_LENGTH
  );
  const ipHash = hashIP(ip);

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.experience.count({
    where: {
      ipHash,
      createdAt: { gte: oneHourAgo },
    },
  });

  if (recentCount >= LIMITS.MAX_EXPERIENCES_PER_HOUR) {
    return {
      success: false,
      error: `Rate limit exceeded. You can only post ${LIMITS.MAX_EXPERIENCES_PER_HOUR} experiences per hour.`,
    };
  }

  try {
    const experience = await prisma.experience.create({
      data: {
        content: sanitizedContent,
        ipHash,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        views: true,
      },
    });

    return { success: true, data: experience };
  } catch (error) {
    console.error("Error creating experience:", error);
    return {
      success: false,
      error: "Failed to save experience. Please try again.",
    };
  }
}

export async function getExperiences(options = {}) {
  const query = querySchema.safeParse(options);
  const { page, limit, search, sort } = query.success
    ? query.data
    : {
        page: 1,
        limit: LIMITS.EXPERIENCES_PER_PAGE,
        sort: SORT_OPTIONS.LATEST,
      };

  const skip = (page - 1) * limit;

  let orderBy;
  switch (sort) {
    case SORT_OPTIONS.OLDEST:
      orderBy = { createdAt: "asc" };
      break;
    case SORT_OPTIONS.MOST_VIEWED:
      orderBy = { views: "desc" };
      break;
    case SORT_OPTIONS.LATEST:
    default:
      orderBy = { createdAt: "desc" };
  }

  let where = {};

  if (search) {
    const allDocs = await prisma.experience.findMany({
      select: { id: true, content: true },
      orderBy: { createdAt: "desc" },
    });

    const fuse = new Fuse(allDocs, {
      keys: ["content"],
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 3,
    });

    const results = fuse.search(search);
    const matchingIds = results.map((result) => result.item.id);

    where = {
      id: { in: matchingIds },
    };
  }

  const [experiences, total] = await Promise.all([
    prisma.experience.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        content: true,
        createdAt: true,
        views: true,
      },
    }),
    prisma.experience.count({ where }),
  ]);

  return {
    experiences,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getExperienceById(id, ip) {
  try {
    let shouldIncrement = true;

    if (ip) {
      const ipHash = hashIP(ip);
      const existingLog = await prisma.viewLog.findUnique({
        where: {
          experienceId_ipHash: {
            experienceId: id,
            ipHash,
          },
        },
      });

      if (existingLog) {
        shouldIncrement = false;
      } else {
        await prisma.viewLog.create({
          data: {
            experienceId: id,
            ipHash,
          },
        });
      }
    }

    const experience = shouldIncrement
      ? await prisma.experience.update({
          where: { id },
          data: {
            views: { increment: 1 },
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            views: true,
          },
        })
      : await prisma.experience.findUnique({
          where: { id },
          select: {
            id: true,
            content: true,
            createdAt: true,
            views: true,
          },
        });

    if (!experience) {
      return { success: false, error: "Experience not found" };
    }

    return { success: true, data: experience };
  } catch (error) {
    if (error.code === "P2025") {
      return { success: false, error: "Experience not found" };
    }
    console.error("Error fetching experience:", error);
    return { success: false, error: "Failed to fetch experience" };
  }
}

export default { createExperience, getExperiences, getExperienceById };
