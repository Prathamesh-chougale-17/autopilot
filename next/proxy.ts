import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  }

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith("/")) {
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
  matcher: ["/admin/:path*", "/dashboard/:path*", "/sign-in", "/sign-up"],
};
