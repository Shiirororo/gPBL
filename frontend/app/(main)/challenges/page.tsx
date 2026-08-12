import type { Metadata } from "next"

import ChallengeList from "@/components/ChallengeList"
import { CalendarWidget } from "@/components/UserCalendar"

export const metadata: Metadata = { title: "Challenges" }

export default function ChallengesPage() {
  return (
    <div className="flex h-[calc(100vh-3rem)] gap-4 bg-zinc-100 p-4 dark:bg-zinc-900">
      <aside className="hidden w-72 shrink-0 flex-col lg:flex">
        <CalendarWidget />
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <ChallengeList />
      </section>
    </div>
  )
}
