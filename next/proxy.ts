import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const PUBLIC_ROUTES = ["/", "/sign-in", "/sign-up"];

  // Protect dashboard routes
  if (!PUBLIC_ROUTES.includes(request.nextUrl.pathname)) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (
    sessionCookie &&
    (request.nextUrl.pathname === "/sign-in" ||
      request.nextUrl.pathname === "/sign-up")
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}
export const config = {
  matcher: ["/dashboard", "/admin/:path*", "/sign-in", "/sign-up"], // Apply middleware to specific routes
};
