import { NextResponse } from "next/server"

import { backendFailureResponse, readJsonBody, readResponseBody } from "@/app/api/auth/_shared"
import { parseRegisterInput } from "@/features/auth/schemas"
import { setAuthCookies } from "@/lib/auth/cookies"
import { isTokenPair } from "@/lib/auth/tokens"
import { getBackendUrl } from "@/lib/env"

export async function POST(request: Request): Promise<NextResponse> {
  const parsedInput = parseRegisterInput(await readJsonBody(request))
  if (!parsedInput.success) {
    return NextResponse.json({ message: parsedInput.message }, { status: 400 })
  }

  try {
    const registerResponse = await fetch(`${getBackendUrl()}/api/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsedInput.data),
      cache: "no-store",
    })
    const user = await readResponseBody(registerResponse)

    if (!registerResponse.ok) {
      return NextResponse.json(user, { status: registerResponse.status })
    }

    const loginResponse = await fetch(`${getBackendUrl()}/api/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsedInput.data),
      cache: "no-store",
    })
    const tokens = await readResponseBody(loginResponse)

    if (!loginResponse.ok || !isTokenPair(tokens)) {
      return NextResponse.json(
        {
          authenticated: false,
          user,
          message: "The account was created, but automatic login failed.",
        },
        { status: 201 },
      )
    }

    const profileResponse = await fetch(`${getBackendUrl()}/api/user/me/`, {
      headers: { Authorization: `Bearer ${tokens.access}` },
      cache: "no-store",
    })
    const profile = await readResponseBody(profileResponse)
    if (!profileResponse.ok) {
      return NextResponse.json(
        { authenticated: false, user, message: "The account was created, but its profile could not be loaded." },
        { status: 201 },
      )
    }

    await setAuthCookies(tokens.access, tokens.refresh)
    return NextResponse.json(
      { authenticated: true, user: profile },
      { status: 201 },
    )
  } catch (error) {
    return backendFailureResponse(error)
  }
}
