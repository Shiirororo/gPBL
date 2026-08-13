import assert from "node:assert/strict"
import test from "node:test"

import {
  CALENDAR_TIME_ZONE,
  formatCalendarDate,
  toCalendarDayKey,
} from "./calendar-date.ts"

test("formats calendar dates with a deterministic locale and time zone", () => {
  const date = new Date("2026-07-25T18:30:00.000Z")

  assert.equal(CALENDAR_TIME_ZONE, "Asia/Ho_Chi_Minh")
  assert.equal(toCalendarDayKey(date), "2026-07-26")
  assert.match(formatCalendarDate(date), /26/)
})
