import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend-fetch";
import { BackendUnavailableError } from "@/lib/api/errors";

export async function proxySubmissionRequest(
  path: string,
  init: RequestInit = {},
): Promise<NextResponse> {
  try {
    // Dùng lớp fetch chung để tự gắn JWT và thử refresh access token đúng một lần.
    const response = await backendFetch(path, init);
    const body = await response.text();

    return new NextResponse(body || null, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (cause) {
    return NextResponse.json(
      {
        detail:
          cause instanceof BackendUnavailableError
            ? cause.message
            : "The submission request could not be completed.",
      },
      { status: 503 },
    );
  }
}
