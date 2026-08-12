import { NextResponse } from "next/server"

import { refreshAccessToken } from "@/lib/auth/tokens"

export async function POST(): Promise<NextResponse> {
  const accessToken = await refreshAccessToken()

  if (!accessToken) {
    return NextResponse.json(
      { authenticated: false, message: "The session could not be refreshed." },
      { status: 401 },
    )
  }

  return NextResponse.json({ authenticated: true })
}
