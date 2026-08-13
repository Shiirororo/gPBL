export interface LoginInput {
  user_name: string
  password: string
}

export type RegisterInput = LoginInput

export interface AuthenticatedUser {
  user_name: string
  score: number
  streak?: number
}

export interface AuthResult {
  authenticated: boolean
  user?: AuthenticatedUser
}
