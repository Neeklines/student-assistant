import { getEventTypeMeta } from "@/lib/eventTypes.js";
import { eventsOnDate } from "@/lib/calendarDates.js";

const HOUR_START = 6; // 06:00 first visible row
const HOUR_END = 22;  // 22:00 last visible hour label (so events ending up to 23:00 still fit)
const HOUR_HEIGHT = 56; // px per hour row

// Convert a Date to minutes-from-day-start.
function minutesIntoDay(d) {
  return d.getHours() * 60 + d.getMinutes();
}

// Compute top + height in px for an event, clamped to the visible window.
function eventPosition(event) {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  const windowStart = HOUR_START * 60;
  const windowEnd = (HOUR_END + 1) * 60; // include the trailing 60 min after 22:00 → up to 23:00
  const startMin = Math.max(minutesIntoDay(start), windowStart);
  // If the event crosses midnight (end is the next day, so minutesIntoDay(end) < startMin),
  // treat the end as the end of the current day window so the block doesn't render with
  // negative height. Multi-day spanning bars are out of scope (see spec).
  const rawEndMin = minutesIntoDay(end);
  const effectiveEndMin = rawEndMin < startMin ? windowEnd : rawEndMin;
  const endMin = Math.min(effectiveEndMin, windowEnd);
  const top = ((startMin - windowStart) / 60) * HOUR_HEIGHT;
  const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 24); // min visual height for very short events
  return { top, height };
}

// Naive overlap layout: assign each event a "column" so overlapping events sit side-by-side.
// Up to 2 columns rendered side-by-side; 3+ collapsed into a "+N" chip on the second column.
function assignColumns(events) {
  // Sort by start time, then by end time for stable layout.
  const sorted = [...events].sort((a, b) => {
    const sa = new Date(a.start_time).getTime();
    const sb = new Date(b.start_time).getTime();
    if (sa !== sb) return sa - sb;
    return new Date(a.end_time).getTime() - new Date(b.end_time).getTime();
  });
  // For each event, find earliest column where its time doesn't overlap any prior event in that column.
  const columns = [];
  const placement = []; // index aligned with sorted[]
  sorted.forEach((evt) => {
    const start = new Date(evt.start_time).getTime();
    const end = new Date(evt.end_time).getTime();
    let placed = false;
    for (let i = 0; i < columns.length; i++) {
      const last = columns[i][columns[i].length - 1];
      const lastEnd = new Date(last.end_time).getTime();
      if (lastEnd <= start) {
        columns[i].push(evt);
        placement.push(i);
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([evt]);
      placement.push(columns.length - 1);
    }
  });
  return { sorted, placement, columnCount: columns.length };
}

export default function DayView({ events, currentDate, onEditEvent }) {
  const dayEvents = eventsOnDate(events, currentDate);

  if (dayEvents.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">Brak wydarzeń w tym dniu. Dodaj pierwsze ↓</p>
      </div>
    );
  }

  const { sorted, placement, columnCount } = assignColumns(dayEvents);

  // Cap visible columns at 2; events placed in column 0 use the left half, column 1 uses the right.
  // Events with placement >= 2 collapse into a "+N" chip on the right column at the latest of their hour positions.
  const visibleColumns = Math.min(columnCount, 2);
  const overflowEvents = sorted.filter((_, i) => placement[i] >= 2);
  const placedEvents = sorted.filter((_, i) => placement[i] < 2);
  const placedPlacement = placement.filter((p) => p < 2);

  const hours = [];
  for (let h = HOUR_START; h <= HOUR_END; h++) hours.push(h);

  return (
    <div className="relative grid flex-1 overflow-y-auto" style={{ gridTemplateColumns: "48px 1fr" }}>
      {/* Hour labels column */}
      <div className="border-r border-border">
        {hours.map((h) => (
          <div
            key={h}
            className="flex items-start justify-end pr-2 pt-1 text-[10px] text-muted-foreground"
            style={{ height: HOUR_HEIGHT }}
          >
            {String(h).padStart(2, "0")}:00
          </div>
        ))}
      </div>

      {/* Events plane */}
      <div className="relative">
        {/* Hour rows (background grid) */}
        {hours.map((h) => (
          <div
            key={h}
            className="border-b border-border/40"
            style={{ height: HOUR_HEIGHT }}
          />
        ))}

        {/* Event blocks */}
        {placedEvents.map((evt, i) => {
          const col = placedPlacement[i];
          const { top, height } = eventPosition(evt);
          const meta = getEventTypeMeta(evt.event_type);
          const widthPct = visibleColumns === 1 ? 100 : 50;
          const leftPct = visibleColumns === 1 ? 0 : col * 50;
          const start = new Date(evt.start_time);
          const end = new Date(evt.end_time);
          const timeLabel = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")} – ${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
          return (
            <button
              key={evt.id}
              type="button"
              onClick={() => onEditEvent(evt)}
              className={`absolute overflow-hidden rounded-md border-l-[3px] px-2 py-1 text-left text-[11px] leading-tight transition-shadow hover:shadow ${meta.iconClass}`}
              style={{
                top,
                height,
                left: `calc(${leftPct}% + 2px)`,
                width: `calc(${widthPct}% - 4px)`,
                borderLeftColor: "currentColor",
              }}
              aria-label={`Edytuj ${evt.title}`}
            >
              <div className="truncate font-medium">{evt.title}</div>
              <div className="truncate opacity-80">{timeLabel}</div>
              {evt.description && <div className="truncate opacity-70">{evt.description}</div>}
            </button>
          );
        })}

        {/* Overflow chip (if any events are in column 3+) */}
        {overflowEvents.length > 0 && (
          <div
            className="absolute right-1 top-1 rounded-full bg-foreground/80 px-2 py-0.5 text-[10px] text-background"
            style={{ pointerEvents: "none" }}
          >
            +{overflowEvents.length} więcej
          </div>
        )}
      </div>
    </div>
  );
}
