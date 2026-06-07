import { getEventTypeMeta } from "@/lib/eventTypes.js";
import {
  startOfWeek,
  addDays,
  eventsOnDate,
  isToday,
  formatPolishWeekdayShort,
} from "@/lib/calendarDates.js";

const HOUR_START = 6;
const HOUR_END = 22;
const HOUR_HEIGHT = 40; // px per hour row — tighter than DayView's 56 to fit 7 columns

function minutesIntoDay(d) {
  return d.getHours() * 60 + d.getMinutes();
}

function eventPosition(event) {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  const windowStart = HOUR_START * 60;
  const windowEnd = (HOUR_END + 1) * 60;
  const startMin = Math.max(minutesIntoDay(start), windowStart);
  const rawEndMin = minutesIntoDay(end);
  const effectiveEndMin = rawEndMin < startMin ? windowEnd : rawEndMin;
  const endMin = Math.min(effectiveEndMin, windowEnd);
  const top = ((startMin - windowStart) / 60) * HOUR_HEIGHT;
  const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 18);
  return { top, height };
}

export default function WeekView({ events, currentDate, onEditEvent }) {
  const weekStart = startOfWeek(currentDate);
  const days = [];
  for (let i = 0; i < 7; i++) days.push(addDays(weekStart, i));

  const hours = [];
  for (let h = HOUR_START; h <= HOUR_END; h++) hours.push(h);

  // Format time label for events.
  const formatTime = (d) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  const totalEventsInWeek = days.reduce(
    (sum, d) => sum + eventsOnDate(events, d).length,
    0,
  );

  if (totalEventsInWeek === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">Brak wydarzeń w tym tygodniu. Dodaj pierwsze ↓</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {/* Sticky header row: weekday names + date numbers */}
      <div
        className="grid border-b border-border bg-secondary/30"
        style={{ gridTemplateColumns: "40px repeat(7, 1fr)" }}
      >
        <div /> {/* spacer above hour-labels column */}
        {days.map((d) => {
          const today = isToday(d);
          return (
            <div
              key={d.toISOString()}
              className={`flex flex-col items-center py-1 text-[10px] ${today ? "text-primary font-semibold" : "text-muted-foreground"}`}
            >
              <span>{formatPolishWeekdayShort(d)}</span>
              <span
                className={
                  today
                    ? "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground"
                    : "mt-0.5 text-[11px] font-semibold text-foreground"
                }
              >
                {d.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Scrollable grid: hour labels + 7 day columns */}
      <div className="grid flex-1 overflow-y-auto" style={{ gridTemplateColumns: "40px repeat(7, 1fr)" }}>
        {/* Hour labels column */}
        <div className="border-r border-border">
          {hours.map((h) => (
            <div
              key={h}
              className="flex items-start justify-end pr-1 pt-1 text-[9px] text-muted-foreground"
              style={{ height: HOUR_HEIGHT }}
            >
              {String(h).padStart(2, "0")}
            </div>
          ))}
        </div>

        {/* 7 day columns */}
        {days.map((day) => {
          const today = isToday(day);
          const dayEvents = eventsOnDate(events, day);
          // Sort by start so later events render on top in case of overlap (last in source = highest z).
          const sorted = [...dayEvents].sort(
            (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
          );
          return (
            <div
              key={day.toISOString()}
              className={`relative border-r border-border last:border-r-0 ${today ? "bg-primary/5" : ""}`}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  className="border-b border-border/30"
                  style={{ height: HOUR_HEIGHT }}
                />
              ))}
              {sorted.map((evt) => {
                const { top, height } = eventPosition(evt);
                const meta = getEventTypeMeta(evt.event_type);
                return (
                  <button
                    key={evt.id}
                    type="button"
                    onClick={() => onEditEvent(evt)}
                    className={`absolute overflow-hidden rounded-sm border-l-[2px] px-1 py-0.5 text-left text-[9px] leading-tight transition-shadow hover:shadow ${meta.iconClass}`}
                    style={{
                      top,
                      height,
                      left: 1,
                      right: 1,
                      borderLeftColor: "currentColor",
                    }}
                    aria-label={`Edytuj ${evt.title}`}
                  >
                    <div className="truncate font-medium">{evt.title}</div>
                    <div className="truncate opacity-80">{formatTime(new Date(evt.start_time))}</div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
