import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

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
    const response = await fetch(`${BACKEND_URL}/api/challenges/challenge/${challengeId}/`, {
      method: "GET",
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({ error: "Invalid backend response." }));

    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Challenge service is unavailable." }, { status: 503 });
  }
}
