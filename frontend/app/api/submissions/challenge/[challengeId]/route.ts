import { NextRequest, NextResponse } from "next/server";
import { proxySubmissionRequest } from "@/features/submissions/server";

interface RouteContext {
  params: Promise<{ challengeId: string }>;
}

function parseId(value: string): number | null {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const challengeId = parseId((await context.params).challengeId);
  if (!challengeId) {
    return NextResponse.json({ detail: "Invalid challenge ID." }, { status: 400 });
  }

  return proxySubmissionRequest(`/api/challenge/${challengeId}/submissions/`);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const challengeId = parseId((await context.params).challengeId);
  if (!challengeId) {
    return NextResponse.json({ detail: "Invalid challenge ID." }, { status: 400 });
  }

  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ detail: "A JSON request body is required." }, { status: 400 });
  }

  const { code, language } = payload as Record<string, unknown>;
  if (typeof code !== "string" || !code.trim()) {
    return NextResponse.json({ detail: "Submission code cannot be empty." }, { status: 400 });
  }
  if (typeof language !== "string" || !language.trim()) {
    return NextResponse.json({ detail: "A programming language is required." }, { status: 400 });
  }

  // Backend hiện chỉ nhận trường code; language vẫn được kiểm tra tại BFF để giữ contract UI rõ ràng.
  return proxySubmissionRequest(`/api/challenge/${challengeId}/submit/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
}
