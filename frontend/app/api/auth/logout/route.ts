import { NextResponse, NextRequest } from "next/server"

import { clearAuthCookies } from "@/lib/auth/cookies"

export async function POST(request: NextRequest): Promise<NextResponse> {
  await clearAuthCookies()
  
  // Get the origin from the request
  const origin = request.nextUrl.origin
  
  // Redirect directly to login page after clearing cookies
  return NextResponse.redirect(new URL("/auth/login", origin))
}
