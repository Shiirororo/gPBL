import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend-fetch";

interface RouteContext {
  params: Promise<{ challengeId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { challengeId } = await context.params;

  if (!/^\d+$/.test(challengeId) || Number(challengeId) < 1) {
    return NextResponse.json({ error: "Invalid challenge ID." }, { status: 400 });
  }

  try {
    // BFF chuyển tiếp request chi tiết challenge và giữ nguyên HTTP status từ Django.
    const response = await backendFetch(`/api/challenges/challenge/${challengeId}/`, {
      method: "GET",
    });
    const body = await response.json().catch(() => ({ error: "Invalid backend response." }));

    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Challenge service is unavailable." }, { status: 503 });
  }
}
