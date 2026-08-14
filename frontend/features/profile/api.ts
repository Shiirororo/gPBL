import type { AuthenticatedUser } from "@/features/auth/types"
import { isAvailableAvatar } from "@/features/profile/avatars"
import type { UpdateAvatarInput } from "@/features/profile/types"

export async function updateAvatar(input: UpdateAvatarInput): Promise<AuthenticatedUser> {
  const response = await fetch("/api/user/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = data?.avatar?.[0] ?? data?.detail ?? "Unable to update avatar."
    throw new Error(typeof message === "string" ? message : "Unable to update avatar.")
  }
  if (
    typeof data?.user_name !== "string" ||
    typeof data?.score !== "number" ||
    !isAvailableAvatar(data?.avatar)
  ) {
    throw new Error("The server returned an invalid profile.")
  }

  return {
    user_name: data.user_name,
    score: data.score,
    avatar: data.avatar,
    ...(typeof data.streak === "number" ? { streak: data.streak } : {}),
  }
}
