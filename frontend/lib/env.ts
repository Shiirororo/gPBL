const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000"

export function getBackendUrl(): string {
  const configuredUrl = process.env.BACKEND_URL?.trim() || DEFAULT_BACKEND_URL

  try {
    return new URL(configuredUrl).origin
  } catch {
    throw new Error("BACKEND_URL must be a valid absolute URL.")
  }
}

export function shouldUseSecureCookies(): boolean {
  const configuredValue = process.env.COOKIE_SECURE?.trim().toLowerCase()

  if (configuredValue === "true") return true
  if (configuredValue === "false") return false

  return process.env.NODE_ENV === "production"
}
