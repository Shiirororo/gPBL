import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend-fetch"
import { BackendUnavailableError } from "@/lib/api/errors"

interface RouteContext {
  params: Promise<{ challengeId: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  const { challengeId } = await context.params

  if (!/^\d+$/.test(challengeId) || Number(challengeId) < 1) {
    return NextResponse.json({ error: "Invalid challenge ID." }, { status: 400 })
  }

  try {
    const response = await backendFetch(
      `/api/challenges/challenge/${challengeId}/start/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
    )

    const text = await response.text()
    return new NextResponse(text || null, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" },
    })
  } catch (error) {
    if (error instanceof BackendUnavailableError) {
      return NextResponse.json({ error: "Challenge service is unavailable." }, { status: 503 })
    }
    throw error
  }
}
