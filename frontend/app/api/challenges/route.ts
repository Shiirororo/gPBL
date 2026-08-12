import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

export async function GET() {
  try {
    // Django hiện chưa có GET collection; route này giữ contract cho khi backend bổ sung.
    const response = await fetch(`${BACKEND_URL}/api/challenges/challenge/`, {
      method: "GET",
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({ error: "Invalid backend response." }));

    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Challenge service is unavailable." }, { status: 503 });
  }
}
