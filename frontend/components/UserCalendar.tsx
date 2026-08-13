"use client"

import * as React from "react"
import { vi } from "date-fns/locale"

import { Calendar } from "@/components/ui/calendar"
import { useNotifications } from "@/context/NotificationContext"
import {
  CALENDAR_TIME_ZONE,
  formatCalendarDate,
  toCalendarDayKey,
} from "@/lib/calendar-date"

export function CalendarWidget() {
  const [selected, setSelected] = React.useState<Date | undefined>(new Date())
  const { notifications } = useNotifications()

  // Build a set of YYYY-MM-DD strings that have at least one notification
  const notificationDates = React.useMemo(() => {
    const set = new Set<string>()
    for (const n of notifications) {
      const dayKey = toCalendarDayKey(new Date(n.start_time))
      if (dayKey) set.add(dayKey)
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
        locale={vi}
        timeZone={CALENDAR_TIME_ZONE}
        className="rounded-lg border"
        modifiers={{
          hasNotification: (date) => notificationDates.has(toCalendarDayKey(date)),
        }}
        modifiersClassNames={{
          hasNotification: "rdp-day_has_notification",
        }}
      />

      {selected && (
        <p className="text-center rounded-lg text-sm text-muted-foreground">
          {formatCalendarDate(selected)}
        </p>
      )}

      {/* Notification list for selected day */}

      {/* Add notification */}

    </div>
  )
}
