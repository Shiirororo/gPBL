export const CALENDAR_LOCALE_CODE = "vi-VN"
export const CALENDAR_TIME_ZONE = "Asia/Ho_Chi_Minh"

const calendarDateFormatter = new Intl.DateTimeFormat(CALENDAR_LOCALE_CODE, {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: CALENDAR_TIME_ZONE,
})

const calendarDayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: CALENDAR_TIME_ZONE,
})

export function formatCalendarDate(date: Date): string {
  return Number.isNaN(date.getTime()) ? "" : calendarDateFormatter.format(date)
}

export function toCalendarDayKey(date: Date): string {
  if (Number.isNaN(date.getTime())) return ""

  const parts = Object.fromEntries(
    calendarDayKeyFormatter
      .formatToParts(date)
      .filter(({ type }) => type === "year" || type === "month" || type === "day")
      .map(({ type, value }) => [type, value]),
  )

  return `${parts.year}-${parts.month}-${parts.day}`
}
