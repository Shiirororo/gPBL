"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { useNotifications } from "@/context/NotificationContext"

function toYMD(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function CalendarWidget() {
  const [selected, setSelected] = React.useState<Date | undefined>(new Date())
  const { notifications } = useNotifications()

  // Build a set of YYYY-MM-DD strings that have at least one notification
  const notificationDates = React.useMemo(() => {
    const set = new Set<string>()
    for (const n of notifications) {
      set.add(toYMD(new Date(n.start_time)))
    }
    return set
  }, [notifications])

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Calendar
      </h2>

      <Calendar
        mode="single"
        selected={selected}
        onSelect={setSelected}
        className="rounded-lg border"
        modifiers={{
          hasNotification: (date) => notificationDates.has(toYMD(date)),
        }}
        modifiersClassNames={{
          hasNotification: "rdp-day_has_notification",
        }}
      />

      {selected && (
        <p className="text-center rounded-lg text-sm text-muted-foreground">
          {selected.toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      )}

      {/* Notification list for selected day */}

      {/* Add notification */}

    </div>
  )
}
