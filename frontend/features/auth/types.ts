export interface LoginInput {
  user_name: string
  password: string
}

export type RegisterInput = LoginInput

export interface AuthenticatedUser {
  user_id: number
  user_name: string
}

export interface AuthResult {
  authenticated: boolean
  user?: AuthenticatedUser
}
