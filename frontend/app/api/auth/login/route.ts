import { NextResponse } from "next/server"

import { readJsonBody, readResponseBody, backendFailureResponse } from "@/app/api/auth/_shared"
import { parseLoginInput } from "@/features/auth/schemas"
import { setAuthCookies } from "@/lib/auth/cookies"
import { isTokenPair } from "@/lib/auth/tokens"
import { getBackendUrl } from "@/lib/env"

export async function POST(request: Request): Promise<NextResponse> {
  const parsedInput = parseLoginInput(await readJsonBody(request))
  if (!parsedInput.success) {
    return NextResponse.json({ message: parsedInput.message }, { status: 400 })
  }

  try {
    const response = await fetch(`${getBackendUrl()}/api/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsedInput.data),
      cache: "no-store",
    })
    const data = await readResponseBody(response)

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }
    if (!isTokenPair(data)) {
      return NextResponse.json(
        { message: "The authentication server returned an invalid response." },
        { status: 502 },
      )
    }

    await setAuthCookies(data.access, data.refresh)
    return NextResponse.json({ authenticated: true })
  } catch (error) {
    return backendFailureResponse(error)
  }
}
