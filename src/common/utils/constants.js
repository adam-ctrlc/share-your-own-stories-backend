/**
 * Application constants
 */

export const LIMITS = {
  EXPERIENCE_MIN_LENGTH: 10,
  EXPERIENCE_MAX_LENGTH: 2000,
  EXPERIENCES_PER_PAGE: 20,
  MAX_EXPERIENCES_PER_HOUR: 5, // Rate limit per IP
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
};

export default { LIMITS, HTTP_STATUS };
