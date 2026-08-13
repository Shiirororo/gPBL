import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend-fetch"

interface RouteContext {
  params: Promise<{ assessmentId: string }>
}

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const { assessmentId } = await context.params

  if (!/^\d+$/.test(assessmentId) || Number(assessmentId) < 1) {
    return NextResponse.json({ error: "Invalid assessment ID." }, { status: 400 })
  }

  const response = await backendFetch(`/api/assessments/${assessmentId}/`, { cache: "no-store" })
  const data = await response.json().catch(() => ({}))
  return NextResponse.json(data, { status: response.status })
}

export async function POST(request: Request, context: RouteContext): Promise<NextResponse> {
  const { assessmentId } = await context.params

  if (!/^\d+$/.test(assessmentId) || Number(assessmentId) < 1) {
    return NextResponse.json({ error: "Invalid assessment ID." }, { status: 400 })
  }

  const body = await request.json().catch(() => null)

  const response = await backendFetch(`/api/assessments/${assessmentId}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== null ? JSON.stringify(body) : undefined,
  })
  const data = await response.json().catch(() => ({}))
  return NextResponse.json(data, { status: response.status })
}
