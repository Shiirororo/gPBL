import type { AvatarName } from "@/features/profile/avatars"

export interface LoginInput {
  user_name: string
  password: string
}

export type RegisterInput = LoginInput

export interface AuthenticatedUser {
  user_name: string
  score: number
  avatar: AvatarName
  streak?: number
}

export interface AuthResult {
  authenticated: boolean
  user?: AuthenticatedUser
}
