import crypto from "crypto";

let warnedInsecureDefault = false;

/**
 * Resolves the admin password.
 *
 * Production fails closed: with `ADMIN_PASSWORD` unset the app accepts no
 * admin sessions at all. Development keeps the historical "admin" default so
 * the console is usable locally, but logs a loud warning once.
 */
function resolveAdminPassword(): string | null {
  const fromEnv = process.env.ADMIN_PASSWORD;
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv;

  if (process.env.NODE_ENV !== "production") {
    if (!warnedInsecureDefault) {
      warnedInsecureDefault = true;
      console.warn(
        "[auth] ADMIN_PASSWORD is not set — falling back to the insecure development default (\"admin\"). " +
          "Set ADMIN_PASSWORD before deploying; production refuses the default."
      );
    }
    return "admin";
  }

  return null;
}

/**
 * Validates a provided password or token against ADMIN_PASSWORD using
 * timing-safe buffer comparison to prevent timing attacks.
 */
export function verifyAdminAuth(providedSecret: string | null | undefined): boolean {
  if (!providedSecret) return false;
  const adminPassword = resolveAdminPassword();
  if (!adminPassword) return false;

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
