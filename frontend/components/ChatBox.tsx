"use client"

import * as React from "react"
import { PaperPlaneTiltIcon, PhoneIcon, VideoIcon, DotsThreeIcon } from "@phosphor-icons/react"

import { Message, type MessageRole } from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"

// ─── Mock Data ───────────────────────────────────────────────────────────────

interface MockMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: string
}

const MOCK_MESSAGES: MockMessage[] = [
  {
    id: "1",
    role: "system",
    content: "You are a helpful assistant for a project-based learning platform.",
    timestamp: "2026-08-07T08:00:00+07:00",
  },
  {
    id: "2",
    role: "user",
    content: "Hi! Can you explain what project-based learning is?",
    timestamp: "2026-08-07T08:01:00+07:00",
  },
  {
    id: "3",
    role: "assistant",
    content:
      "Project-based learning (PBL) is a teaching method where students gain knowledge and skills by working on a real-world project over an extended period. Instead of rote memorisation, learners actively investigate and respond to a complex question or challenge.",
    timestamp: "2026-08-07T08:01:15+07:00",
  },
  {
    id: "4",
    role: "user",
    content: "What are the key benefits compared to traditional learning?",
    timestamp: "2026-08-07T08:02:00+07:00",
  },
  {
    id: "5",
    role: "assistant",
    content:
      "Great question! The main benefits of PBL include:\n\n1. **Deeper understanding** — Students engage with content in context, not isolation.\n2. **21st-century skills** — Collaboration, critical thinking, and communication are practised naturally.\n3. **Motivation** — Real-world relevance makes learners more invested in the outcome.\n4. **Retention** — Active doing beats passive listening for long-term memory.\n5. **Differentiation** — Projects can flex to meet various learning styles and abilities.",
    timestamp: "2026-08-07T08:02:30+07:00",
  },
  {
    id: "6",
    role: "user",
    content: "How do I get started designing a PBL unit?",
    timestamp: "2026-08-07T08:03:10+07:00",
  },
  {
    id: "7",
    role: "assistant",
    content:
      "Here's a simple roadmap:\n\n• Start with the **driving question** — an open-ended, challenging question that anchors the project.\n• Identify the **learning standards** you want to address.\n• Design a **culminating product** or presentation.\n• Plan **scaffolded activities** that build skills progressively.\n• Build in **reflection checkpoints** so students can iterate.\n\nWould you like help drafting a driving question for a specific subject?",
    timestamp: "2026-08-07T08:03:45+07:00",
  },
  {
    id: "8",
    role: "user",
    content: "Yes please! Let's try a Grade 8 science unit on climate change.",
    timestamp: "2026-08-07T08:04:20+07:00",
  },
  {
    id: "9",
    role: "user",
    content: "Thank you so much",
    timestamp: "2026-08-07T08:04:20+07:00",
  },
  {
    id: "10",
    role: "assistant",
    content:
      'Here are a few driving question options for your Grade 8 climate change unit:\n\n1. "How can our community reduce its carbon footprint by 20% in one year?"\n2. "What would our city look like in 2050 if we do — or don\'t — act on climate change today?"\n3. "How might we redesign our school to be carbon-neutral?"\n\nOption 2 tends to be especially engaging because it\'s personal and visually imaginative. Students can create maps, models, or digital simulations. Which direction interests you most?',
    timestamp: "2026-08-07T08:04:55+07:00",
  },
]

// ─── ChatBox ──────────────────────────────────────────────────────────────────

export default function ChatBox() {
  const [draft, setDraft] = React.useState("")

  return (
    <div className="flex w-full max-w-[600px] h-[750px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/20 dark:shadow-black/60">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        {/* Avatar with online dot */}
        <div className="relative shrink-0">
          <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white select-none">
            AI
          </div>
          <span className="absolute bottom-0 right-0 block size-2.5 rounded-full border-2 border-card bg-emerald-400" />
        </div>

        {/* Name + status */}
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold text-foreground">gPBL Assistant</span>
          <span className="text-[11px] text-emerald-500 dark:text-emerald-400">Active now</span>
        </div>

        {/* Action buttons */}
        <div className="ml-auto flex items-center gap-1">
          <button
            aria-label="Voice call"
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <PhoneIcon weight="bold" className="size-4" />
          </button>
          <button
            aria-label="Video call"
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <VideoIcon weight="bold" className="size-4" />
          </button>
          <button
            aria-label="More options"
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <DotsThreeIcon weight="bold" className="size-4" />
          </button>
        </div>
      </div>

      {/* ── Message Area ── */}
      <div className="relative flex min-h-0 flex-1 flex-col bg-background dark:bg-zinc-950">
        <MessageScrollerProvider>
          <MessageScroller className="flex-1">
            <MessageScrollerViewport>
              <MessageScrollerContent className="py-4">
                {MOCK_MESSAGES.map((message) => (
                  <MessageScrollerItem
                    key={message.id}
                    scrollAnchor={message.role === "user"}
                  >
                    <Message
                      role={message.role}
                      content={message.content}
                      timestamp={message.timestamp}
                    />
                  </MessageScrollerItem>
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>
      </div>

      {/* ── Compose Bar ── */}
      <div className="flex items-end gap-2 border-t border-border bg-card px-3 py-3">
        <textarea
          id="compose-input"
          aria-label="Type a message"
          placeholder="Aa"
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              setDraft("")
            }
          }}
          className="flex-1 resize-none rounded-2xl border border-border bg-muted px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
        <button
          aria-label="Send message"
          disabled={!draft.trim()}
          onClick={() => setDraft("")}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition-all hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <PaperPlaneTiltIcon weight="fill" className="size-4" />
        </button>
      </div>

    </div>
  )
}