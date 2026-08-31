import crypto from "crypto";

/**
 * Validates a provided password or token against ADMIN_PASSWORD using
 * timing-safe buffer comparison to prevent timing attacks.
 */
export function verifyAdminAuth(providedSecret: string | null | undefined): boolean {
  if (!providedSecret) return false;
  const adminPassword = process.env.ADMIN_PASSWORD || "admin";

  const a = crypto.createHash("sha256").update(providedSecret).digest();
  const b = crypto.createHash("sha256").update(adminPassword).digest();

  return crypto.timingSafeEqual(a, b);
}

/**
 * Extracts bearer token from the Authorization header of an incoming Request.
 */
export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7).trim();
}
