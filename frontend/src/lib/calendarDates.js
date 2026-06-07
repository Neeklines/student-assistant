/**
 * calendarDates.js
 *
 * Pure date utility helpers for the calendar grid view.
 * Polish locale, Monday-first week convention.
 *
 * All functions are pure: they never mutate their inputs and always return
 * new Date objects (or primitives/arrays derived from them).
 * No React, no external libraries, no side effects.
 */

// ---------------------------------------------------------------------------
// Day boundaries
// ---------------------------------------------------------------------------

/**
 * Returns a new Date at 00:00:00.000 local time on the same calendar day.
 * @param {Date} d
 * @returns {Date}
 */
export function startOfDay(d) {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

/**
 * Returns a new Date at 23:59:59.999 local time on the same calendar day.
 * @param {Date} d
 * @returns {Date}
 */
export function endOfDay(d) {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}

// ---------------------------------------------------------------------------
// Week boundaries (Monday-first, Polish convention)
// ---------------------------------------------------------------------------

/**
 * Returns the Date of Monday of the week containing d (at 00:00:00 local).
 * Sunday belongs to the PREVIOUS week: e.g. Sun 7 Jun 2026 → Mon 1 Jun 2026.
 *
 * Formula: (getDay() + 6) % 7  →  Sun=6, Mon=0, Tue=1, ..., Sat=5
 * @param {Date} d
 * @returns {Date}
 */
export function startOfWeek(d) {
  const out = startOfDay(d);
  const daysFromMonday = (out.getDay() + 6) % 7;
  out.setDate(out.getDate() - daysFromMonday);
  return out;
}

/**
 * Returns the Date of Sunday at 23:59:59.999 of the week containing d.
 * @param {Date} d
 * @returns {Date}
 */
export function endOfWeek(d) {
  const monday = startOfWeek(d);
  const sunday = addDays(monday, 6);
  return endOfDay(sunday);
}

// ---------------------------------------------------------------------------
// Month boundaries
// ---------------------------------------------------------------------------

/**
 * Returns the Date of the 1st day of d's month at 00:00:00.
 * @param {Date} d
 * @returns {Date}
 */
export function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

/**
 * Returns the Date of the last day of d's month at 23:59:59.999.
 * Uses day=0 trick: new Date(year, month+1, 0) gives the last day.
 * @param {Date} d
 * @returns {Date}
 */
export function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

// ---------------------------------------------------------------------------
// Arithmetic
// ---------------------------------------------------------------------------

/**
 * Returns a new Date n days later (n can be negative).
 * @param {Date} d
 * @param {number} n
 * @returns {Date}
 */
export function addDays(d, n) {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

/**
 * Returns a new Date n weeks later (= n * 7 days).
 * @param {Date} d
 * @param {number} n
 * @returns {Date}
 */
export function addWeeks(d, n) {
  return addDays(d, n * 7);
}

/**
 * Returns a new Date n months later. Day-of-month is preserved when possible,
 * clamped to the last day of the target month to avoid overflow.
 * e.g. Jan 31 + 1 month = Feb 28 (2026), NOT Mar 3.
 * @param {Date} d
 * @param {number} n
 * @returns {Date}
 */
export function addMonths(d, n) {
  const out = new Date(d);
  const targetDay = out.getDate();
  out.setDate(1);
  out.setMonth(out.getMonth() + n);
  const lastDayOfNewMonth = new Date(out.getFullYear(), out.getMonth() + 1, 0).getDate();
  out.setDate(Math.min(targetDay, lastDayOfNewMonth));
  return out;
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

/**
 * True iff a and b are the same calendar day in local time.
 * @param {Date} a
 * @param {Date} b
 * @returns {boolean}
 */
export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * True iff d is today (local time).
 * @param {Date} d
 * @returns {boolean}
 */
export function isToday(d) {
  return isSameDay(d, new Date());
}

// ---------------------------------------------------------------------------
// Date ranges
// ---------------------------------------------------------------------------

/**
 * Returns Date[] of every day from startOfDay(start) to startOfDay(end) inclusive.
 * @param {Date} start
 * @param {Date} end
 * @returns {Date[]}
 */
export function datesInRange(start, end) {
  const dates = [];
  let current = startOfDay(start);
  const last = startOfDay(end);
  while (current <= last) {
    dates.push(new Date(current));
    current = addDays(current, 1);
  }
  return dates;
}

/**
 * Returns Date[] of dates to render in the month grid for d's month.
 * The grid is exactly 6 weeks × 7 days = 42 dates, starting from the Monday
 * of the week containing the 1st of d's month (may include trailing days of
 * the previous month). Always returns exactly 42 dates for layout stability.
 * @param {Date} d
 * @returns {Date[]}
 */
export function monthGridDates(d) {
  const gridStart = startOfWeek(startOfMonth(d));
  const dates = [];
  for (let i = 0; i < 42; i++) {
    dates.push(addDays(gridStart, i));
  }
  return dates;
}

// ---------------------------------------------------------------------------
// Polish formatting helpers
// ---------------------------------------------------------------------------

/**
 * "środa" / "wtorek" — lowercase full Polish weekday name.
 * @param {Date} d
 * @returns {string}
 */
export function formatPolishWeekday(d) {
  return new Intl.DateTimeFormat("pl-PL", { weekday: "long" }).format(d);
}

/**
 * "śr" / "wt" — 2-letter Polish weekday abbreviation, lowercase.
 *
 * Intl's "short" format varies by ICU version (may return "niedz." for Sunday
 * instead of the traditional 2-letter "nd"). We use a fixed lookup table that
 * always produces the canonical Polish 2-letter abbreviations:
 *   pn, wt, śr, cz, pt, sb, nd
 * (Date.getDay(): 0=Sunday, 1=Monday, …, 6=Saturday)
 * @param {Date} d
 * @returns {string}
 */
export function formatPolishWeekdayShort(d) {
  const abbr = ["nd", "pn", "wt", "śr", "cz", "pt", "sb"];
  return abbr[d.getDay()];
}

/**
 * "7 czerwca" — day number + Polish month name (lowercase, genitive form).
 * Intl.DateTimeFormat with { day: "numeric", month: "long" } already produces
 * the genitive in pl-PL (e.g. "7 czerwca").
 * @param {Date} d
 * @returns {string}
 */
export function formatDayMonth(d) {
  return new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" }).format(d);
}

/**
 * "Czerwiec 2026" — capitalized Polish month name + year.
 * Intl gives "czerwiec 2026"; we capitalize the first letter manually.
 * @param {Date} d
 * @returns {string}
 */
export function formatMonthYear(d) {
  const raw = new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric" }).format(d);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

// ---------------------------------------------------------------------------
// Event filtering helpers
// ---------------------------------------------------------------------------

/**
 * Returns events from the array whose start_time falls on the given local date.
 * @param {Array<{start_time: string}>} events  Objects with ISO start_time string.
 * @param {Date} date  The calendar day to match.
 * @returns {Array}
 */
export function eventsOnDate(events, date) {
  return events.filter((event) => {
    const eventDate = new Date(event.start_time);
    return isSameDay(eventDate, date);
  });
}

/**
 * Returns events whose start_time is between start (inclusive) and end (inclusive).
 * @param {Array<{start_time: string}>} events
 * @param {Date} start
 * @param {Date} end
 * @returns {Array}
 */
export function eventsInRange(events, start, end) {
  return events.filter((event) => {
    const eventDate = new Date(event.start_time);
    return eventDate >= start && eventDate <= end;
  });
}
