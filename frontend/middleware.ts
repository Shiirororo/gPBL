import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const token = request.cookies.get("access_token");
    const isAuthPage = request.nextUrl.pathname.startsWith("/auth");

    // Redirect to login if no token and not on auth page
    if (!token && !isAuthPage) {
      return NextResponse.redirect(
        new URL("/auth/login", request.url)
      );
    }

    // Redirect to challenges if has token and on auth page
    if (token && isAuthPage) {
      return NextResponse.redirect(
        new URL("/challenges", request.url)
      );
    }

    // Redirect root to challenges
    if (request.nextUrl.pathname === "/") {
      return NextResponse.redirect(
        new URL("/challenges", request.url)
      );
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
      "/",
      "/challenge/:path*",
      "/challenges/:path*",
      "/auth/:path*",
      "/profile/:path*",
      "/leaderboard/:path*",
      "/submissions/:path*",
    ],
};
