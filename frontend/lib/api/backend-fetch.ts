import { getAccessToken } from "@/lib/auth/cookies"
import { refreshAccessToken } from "@/lib/auth/tokens"
import { BackendUnavailableError } from "@/lib/api/errors"
import { getBackendUrl } from "@/lib/env"

export interface BackendFetchOptions extends RequestInit {
  retryOnUnauthorized?: boolean
}

function createBackendUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${getBackendUrl()}${normalizedPath}`
}

async function executeRequest(
  path: string,
  options: RequestInit,
  accessToken: string | null,
): Promise<Response> {
  const headers = new Headers(options.headers)
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`)

  try {
    return await fetch(createBackendUrl(path), {
      ...options,
      headers,
      cache: "no-store",
    })
  } catch {
    throw new BackendUnavailableError()
  }
}

export async function backendFetch(
  path: string,
  options: BackendFetchOptions = {},
): Promise<Response> {
  const { retryOnUnauthorized = true, ...requestOptions } = options
  const accessToken = await getAccessToken()
  const firstResponse = await executeRequest(path, requestOptions, accessToken)

  if (firstResponse.status !== 401 || !retryOnUnauthorized) {
    return firstResponse
  }

  const refreshedAccessToken = await refreshAccessToken()
  if (!refreshedAccessToken) return firstResponse

  return executeRequest(path, requestOptions, refreshedAccessToken)
}
