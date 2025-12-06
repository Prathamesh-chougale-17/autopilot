import { os } from "@orpc/server";
import { z } from "zod";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Helper to get authenticated session or throw
 */
export async function getAuthSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session;
}

/**
 * Helper to check admin role
 */
export async function requireAdmin() {
  const session = await getAuthSession();
  if (session.user.role !== "admin") {
    throw new Error("Forbidden: Admin access required");
  }
  return session;
}

// Re-export os for convenience
export { os, z };
