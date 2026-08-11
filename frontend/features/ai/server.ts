import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend-fetch"
import { BackendUnavailableError } from "@/lib/api/errors"

export async function proxyAI(path: string, init?: RequestInit) {
  try {
    const response = await backendFetch(`/api/ai/${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    })
    const text = await response.text()
    return new NextResponse(text || null, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" },
    })
  } catch (error) {
    if (error instanceof BackendUnavailableError) {
      return NextResponse.json(
        { error: { code: "backend_unavailable", message: error.message } },
        { status: 503 },
      )
    }
    throw error
  }
}

export async function readJSON(request: Request) {
  return JSON.stringify(await request.json())
}
