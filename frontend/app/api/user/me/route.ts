import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend-fetch"
import { isAvailableAvatar } from "@/features/profile/avatars"

export async function GET(): Promise<NextResponse> {
  try {
    const response = await backendFetch("/api/user/me/", { cache: "no-store" })
    const data = await response.json().catch(() => ({}))
    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json(
      { detail: "Cannot connect to the backend server." },
      { status: 503 },
    )
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const body = await request.json().catch(() => null)
  const avatar = body && typeof body === "object" && "avatar" in body
    ? body.avatar
    : null

  if (!isAvailableAvatar(avatar)) {
    return NextResponse.json({ avatar: ["Select an available avatar."] }, { status: 400 })
  }

  try {
    const response = await backendFetch("/api/user/me/", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar }),
    })
    const data = await response.json().catch(() => ({}))
    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json(
      { detail: "Cannot connect to the backend server." },
      { status: 503 },
    )
  }
}
