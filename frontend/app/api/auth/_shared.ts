import { NextResponse } from "next/server"

import { BackendUnavailableError } from "@/lib/api/errors"

export async function readJsonBody(request: Request): Promise<unknown | null> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    return response.json()
  }

  const message = await response.text()
  return message ? { message } : {}
}

export function backendFailureResponse(error: unknown): NextResponse {
  if (error instanceof BackendUnavailableError) {
    return NextResponse.json({ message: error.message }, { status: 503 })
  }

  if (error instanceof TypeError) {
    return NextResponse.json(
      { message: "Cannot connect to the backend server. Make sure Django is running on port 8000." },
      { status: 503 },
    )
  }

  return NextResponse.json(
    { message: "An unexpected authentication error occurred." },
    { status: 500 },
  )
}
