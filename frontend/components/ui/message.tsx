"use client"

import * as React from "react"
import { UserIcon, RobotIcon, CopyIcon, CheckIcon } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

type MessageRole = "user" | "assistant" | "system"

interface MessageProps extends React.ComponentProps<"div"> {
  /** Who sent the message: "user" | "assistant" | "system" */
  role?: MessageRole
  /** Plain-text or markdown content of the message */
  content?: string
  /** Optional ISO timestamp string */
  timestamp?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(iso?: string) {
  if (!iso) return null
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso))
  } catch {
    return null
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MessageAvatar({ role }: { role: MessageRole }) {
  const isUser = role === "user"
  return (
    <div
      aria-hidden
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-sm border",
        isUser
          ? "border-border bg-secondary text-secondary-foreground"
          : "border-border bg-primary text-primary-foreground"
      )}
    >
      {isUser ? (
        <UserIcon weight="bold" className="size-3.5" />
      ) : (
        <RobotIcon weight="bold" className="size-3.5" />
      )}
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable
    }
  }, [text])

  return (
    <button
      aria-label="Copy message"
      onClick={handleCopy}
      className={cn(
        "flex size-6 items-center justify-center rounded-sm text-muted-foreground transition-all duration-150",
        "opacity-0 group-hover/message:opacity-100 focus-visible:opacity-100",
        "hover:bg-muted hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
      )}
    >
      {copied ? (
        <CheckIcon weight="bold" className="size-3 text-green-500 dark:text-green-400" />
      ) : (
        <CopyIcon weight="bold" className="size-3" />
      )}
    </button>
  )
}

// ─── Message ─────────────────────────────────────────────────────────────────

function Message({
  role = "assistant",
  content,
  timestamp,
  className,
  children,
  ...props
}: MessageProps) {
  const isUser = role === "user"
  const time = formatTime(timestamp)
  const displayContent = content ?? (typeof children === "string" ? children : undefined)

  return (
    <div
      data-slot="message"
      data-role={role}
      className={cn(
        "group/message flex w-full gap-3 px-4 py-1",
        isUser ? "flex-row-reverse" : "flex-row",
        className
      )}
      {...props}
    >
      {/* Avatar */}
      <div className="mt-0.5 shrink-0">
        <MessageAvatar role={role} />
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "relative flex max-w-[75%] flex-col gap-1",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* Role label + timestamp */}
        <div
          className={cn(
            "flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground",
            isUser ? "flex-row-reverse" : "flex-row"
          )}
        >
          <span>{isUser ? "You" : "Assistant"}</span>
          {time && <span className="font-normal normal-case tracking-normal">{time}</span>}
        </div>

        {/* Content bubble */}
        <div
          className={cn(
            "relative rounded-sm border px-3 py-2 text-sm leading-relaxed",
            isUser
              ? "border-border bg-secondary text-secondary-foreground"
              : "border-border bg-card text-card-foreground"
          )}
        >
          {displayContent ? (
            <p className="whitespace-pre-wrap break-words">{displayContent}</p>
          ) : (
            children
          )}

          {/* Copy button — appears on hover */}
          {displayContent && (
            <div
              className={cn(
                "absolute -top-3 flex items-center gap-1",
                isUser ? "left-1" : "right-1"
              )}
            >
              <CopyButton text={displayContent} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { Message, type MessageProps, type MessageRole }
