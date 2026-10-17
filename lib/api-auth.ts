import { NextResponse } from "next/server";

import { extractBearerToken, verifyAdminAuth } from "@/lib/auth-guard";

/**
 * Guard for admin-only route handlers. Returns a 401 response when the
 * request carries no valid admin session, or `null` when it may proceed.
 *
 * Usage:
 *   const unauthorized = requireAdminAuth(request);
 *   if (unauthorized) return unauthorized;
 */
export function requireAdminAuth(request: Request): NextResponse | null {
  const token = extractBearerToken(request);
  if (verifyAdminAuth(token)) return null;
  return NextResponse.json(
    { success: false, error: "Unauthorized: admin session required" },
    { status: 401 }
  );
}
