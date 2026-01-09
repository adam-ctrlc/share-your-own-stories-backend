import { Router } from "express";
import {
  createExperience,
  getExperiences,
  getExperienceById,
} from "./experience.service.js";
import {
  createExperienceSchema,
  querySchema,
} from "../../common/utils/schemas.js";
import { z } from "zod";

const router = Router();

const idParamSchema = z.object({
  id: z.string().uuid(),
});

router.post("/", async (req, res) => {
  try {
    const validation = createExperienceSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        errors: validation.error.errors.map((e) => e.message),
      });
    }

    const ip =
      req.ip ||
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown";

    const result = await createExperience(validation.data.content, ip);

    if (!result.success) {
      const status = result.error?.includes("Rate limit") ? 429 : 400;
      return res.status(status).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error in POST /experiences:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const query = querySchema.safeParse(req.query);
    const options = query.success
      ? query.data
      : { page: 1, limit: 20, sort: "latest" };

    const result = await getExperiences(options);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in GET /experiences:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch experiences",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const validation = idParamSchema.safeParse(req.params);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid experience ID",
      });
    }

    const ip =
      req.ip ||
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown";

    const result = await getExperienceById(validation.data.id, ip);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in GET /experiences/:id:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch experience",
    });
  }
});

export default router;
