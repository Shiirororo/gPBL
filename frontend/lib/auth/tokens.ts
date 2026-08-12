import { getBackendUrl } from "@/lib/env"
import {
  clearAuthCookies,
  getRefreshToken,
  setAuthCookies,
} from "@/lib/auth/cookies"

export interface TokenPair {
  access: string
  refresh: string
}

interface RefreshResponse {
  access?: unknown
  refresh?: unknown
}

export function isTokenPair(value: unknown): value is TokenPair {
  if (!value || typeof value !== "object") return false

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.access === "string" &&
    candidate.access.length > 0 &&
    typeof candidate.refresh === "string" &&
    candidate.refresh.length > 0
  )
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken()
  if (!refreshToken) return null

  let response: Response

  try {
    response = await fetch(`${getBackendUrl()}/api/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
      cache: "no-store",
    })
  } catch {
    return null
  }

  if (!response.ok) {
    if (response.status === 400 || response.status === 401) {
      await clearAuthCookies()
    }
    return null
  }

  const data = (await response.json()) as RefreshResponse
  if (typeof data.access !== "string" || data.access.length === 0) {
    await clearAuthCookies()
    return null
  }

  const rotatedRefreshToken =
    typeof data.refresh === "string" && data.refresh.length > 0
      ? data.refresh
      : undefined

  await setAuthCookies(data.access, rotatedRefreshToken)
  return data.access
}
