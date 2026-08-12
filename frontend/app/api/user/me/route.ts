import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend-fetch"

export async function GET(): Promise<NextResponse> {
  const response = await backendFetch("/api/user/me/", { cache: "no-store" })
  const data = await response.json().catch(() => ({}))
  return NextResponse.json(data, { status: response.status })
}
