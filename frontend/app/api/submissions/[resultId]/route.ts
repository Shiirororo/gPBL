import { NextRequest, NextResponse } from "next/server";
import { proxySubmissionRequest } from "@/features/submissions/server";

interface RouteContext {
  params: Promise<{ resultId: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const resultId = Number((await context.params).resultId);
  if (!Number.isSafeInteger(resultId) || resultId <= 0) {
    return NextResponse.json({ detail: "Invalid result ID." }, { status: 400 });
  }

  return proxySubmissionRequest(`/api/submissions/${resultId}/`);
}
