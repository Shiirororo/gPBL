import type { LoginInput, RegisterInput } from "@/features/auth/types"

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; message: string }

function readCredentials(value: unknown): ValidationResult<LoginInput> {
  if (!value || typeof value !== "object") {
    return { success: false, message: "A JSON request body is required." }
  }

  const input = value as Record<string, unknown>
  const rawUserName = input.user_name
  const userName = typeof rawUserName === "string" ? rawUserName.trim() : ""
  const password = typeof input.password === "string" ? input.password : ""

  if (!userName) {
    return { success: false, message: "Username is required." }
  }
  if (!password) {
    return { success: false, message: "Password is required." }
  }
  if (userName.length > 100) {
    return { success: false, message: "Username must not exceed 100 characters." }
  }
  if (password.length > 1024) {
    return { success: false, message: "Password is too long." }
  }

  return { success: true, data: { user_name: userName, password } }
}

export function parseLoginInput(value: unknown): ValidationResult<LoginInput> {
  return readCredentials(value)
}

export function parseRegisterInput(
  value: unknown,
): ValidationResult<RegisterInput> {
  return readCredentials(value)
}
