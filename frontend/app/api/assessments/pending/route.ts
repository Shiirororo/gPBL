import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend-fetch"

export async function GET(): Promise<NextResponse> {
  const response = await backendFetch("/api/assessments/pending/", { cache: "no-store" })
  const data = await response.json().catch(() => ({}))
  return NextResponse.json(data, { status: response.status })
}
