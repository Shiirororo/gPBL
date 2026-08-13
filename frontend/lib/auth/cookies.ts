import { cookies } from "next/headers"

import { shouldUseSecureCookies } from "@/lib/env"

export const ACCESS_TOKEN_COOKIE = "access_token"
export const REFRESH_TOKEN_COOKIE = "refresh_token"

const ACCESS_TOKEN_MAX_AGE_SECONDS = 5 * 60
const REFRESH_TOKEN_MAX_AGE_SECONDS = 24 * 60 * 60

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  }
}

export async function getAccessToken(): Promise<string | null> {
  return (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value ?? null
}

export async function getRefreshToken(): Promise<string | null> {
  return (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value ?? null
}

export async function setAuthCookies(
  accessToken: string,
  refreshToken?: string,
): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(
    ACCESS_TOKEN_COOKIE,
    accessToken,
    cookieOptions(ACCESS_TOKEN_MAX_AGE_SECONDS),
  )

  if (refreshToken) {
    cookieStore.set(
      REFRESH_TOKEN_COOKIE,
      refreshToken,
      cookieOptions(REFRESH_TOKEN_MAX_AGE_SECONDS),
    )
  }
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ACCESS_TOKEN_COOKIE)
  cookieStore.delete(REFRESH_TOKEN_COOKIE)
}
