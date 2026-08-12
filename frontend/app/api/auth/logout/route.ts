import { NextResponse } from "next/server"

import { clearAuthCookies } from "@/lib/auth/cookies"

export async function POST(): Promise<NextResponse> {
  await clearAuthCookies()
  return NextResponse.json({ authenticated: false })
}
