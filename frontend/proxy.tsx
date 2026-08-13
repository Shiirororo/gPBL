import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
    const token = request.cookies.get("access_token");
    const isAuthPage = request.nextUrl.pathname.startsWith("/auth");

    if (!token && !isAuthPage) {
      return NextResponse.redirect(
      new URL("/auth/login", request.url)
      );
    }
    if (token && isAuthPage) {
      return NextResponse.redirect(
      new URL("/challenges", request.url)
    );
  }
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
    "/manga/:path*",
    "/nas/:path*",
    "/auth/:path*",
    "/home/:path*",
    "/profile/:path*",
    ],
};