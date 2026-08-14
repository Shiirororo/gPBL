"use client"

import Image from "next/image"
import { CheckCircle, ImageSquare } from "@phosphor-icons/react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import type { AuthenticatedUser } from "@/features/auth/types"
import { updateAvatar } from "@/features/profile/api"
import {
  AVAILABLE_AVATARS,
  avatarPath,
  type AvatarName,
} from "@/features/profile/avatars"

interface AvatarSelectorDialogProps {
  currentAvatar: AvatarName
  onAvatarUpdated: (user: AuthenticatedUser) => void
}

export default function AvatarSelectorDialog({
  currentAvatar,
  onAvatarUpdated,
}: AvatarSelectorDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarName>(currentAvatar)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSaving && !nextOpen) return
    setOpen(nextOpen)
    setError(null)
    if (nextOpen) setSelectedAvatar(currentAvatar)
  }

  const handleSave = async () => {
    if (selectedAvatar === currentAvatar) {
      setOpen(false)
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      const user = await updateAvatar({ avatar: selectedAvatar })
      onAvatarUpdated(user)
      setOpen(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update avatar.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" className="rounded-xl">
            <ImageSquare weight="bold" />
            Change avatar
          </Button>
        }
      />

      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose your avatar</DialogTitle>
          <DialogDescription>
            Select an avatar for your gPBL profile.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 py-2">
          {AVAILABLE_AVATARS.map((avatar) => {
            const selected = avatar === selectedAvatar
            return (
              <button
                key={avatar}
                type="button"
                aria-label={`Select ${avatar.replace(".png", "")}`}
                aria-pressed={selected}
                disabled={isSaving}
                onClick={() => {
                  setSelectedAvatar(avatar)
                  setError(null)
                }}
                className={`relative aspect-square overflow-hidden rounded-2xl border-2 bg-muted/30 p-1 transition hover:-translate-y-0.5 hover:border-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:pointer-events-none disabled:opacity-60 ${
                  selected
                    ? "border-violet-500 ring-2 ring-violet-500/30"
                    : "border-border"
                }`}
              >
                <Image
                  src={avatarPath(avatar)}
                  alt=""
                  width={128}
                  height={128}
                  className="size-full rounded-xl object-cover"
                />
                {selected && (
                  <CheckCircle
                    weight="fill"
                    className="absolute right-1.5 top-1.5 size-5 rounded-full bg-background text-violet-500"
                  />
                )}
              </button>
            )
          })}
        </div>

        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

        <DialogFooter>
          <DialogClose
            render={
              <Button type="button" variant="outline" className="rounded-xl" disabled={isSaving}>
                Cancel
              </Button>
            }
          />
          <Button
            type="button"
            className="rounded-xl bg-violet-600 text-white hover:bg-violet-500"
            disabled={isSaving || selectedAvatar === currentAvatar}
            onClick={() => void handleSave()}
          >
            {isSaving && <Spinner />}
            {isSaving ? "Saving..." : "Save avatar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
