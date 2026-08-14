import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend-fetch";

export async function GET() {
  try {
    // Django hiện chưa có GET collection; route này giữ contract cho khi backend bổ sung.
    const response = await backendFetch("/api/challenges/challenge/", {
      method: "GET",
    });
    const body = await response.json().catch(() => ({ error: "Invalid backend response." }));

    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Challenge service is unavailable." }, { status: 503 });
  }
}
