import type {
  AuthResult,
  LoginInput,
  RegisterInput,
} from "@/features/auth/types"

async function sendAuthRequest(
  path: string,
  input?: LoginInput | RegisterInput,
): Promise<AuthResult> {
  const response = await fetch(path, {
    method: "POST",
    headers: input ? { "Content-Type": "application/json" } : undefined,
    body: input ? JSON.stringify(input) : undefined,
  })
  const data = (await response.json()) as AuthResult & { message?: string }

  if (!response.ok) {
    throw new Error(data.message || "Authentication request failed.")
  }

  return data
}

export function login(input: LoginInput): Promise<AuthResult> {
  return sendAuthRequest("/api/auth/login", input)
}

export function register(input: RegisterInput): Promise<AuthResult> {
  return sendAuthRequest("/api/auth/register", input)
}

export function refreshSession(): Promise<AuthResult> {
  return sendAuthRequest("/api/auth/refresh")
}

export function logout(): Promise<AuthResult> {
  return sendAuthRequest("/api/auth/logout")
}
