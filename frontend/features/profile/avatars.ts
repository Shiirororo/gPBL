export const AVAILABLE_AVATARS = [
  "Avatar01.png",
  "Avatar02.png",
  "Avatar03.png",
  "Avatar04.png",
  "Avatar05.png",
  "Avatar06.png",
] as const

export type AvatarName = (typeof AVAILABLE_AVATARS)[number]

export const DEFAULT_AVATAR: AvatarName = AVAILABLE_AVATARS[0]

export function isAvailableAvatar(value: unknown): value is AvatarName {
  return typeof value === "string" && AVAILABLE_AVATARS.some((avatar) => avatar === value)
}

export function avatarPath(avatar: AvatarName): string {
  return `/avatars/${avatar}`
}
