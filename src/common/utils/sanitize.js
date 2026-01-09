import { createHash } from "crypto";

export function sanitizeText(input, maxLength = 2000) {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .replace(/\0/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function hashIP(ip) {
  if (!ip) return "unknown";

  return createHash("sha256")
    .update(ip + (process.env.IP_SALT || "default-salt"))
    .digest("hex")
    .slice(0, 16);
}

export default { sanitizeText, hashIP };
