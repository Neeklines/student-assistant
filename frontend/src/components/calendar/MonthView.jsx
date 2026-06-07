import { getEventTypeMeta } from "@/lib/eventTypes.js";
import {
  monthGridDates,
  eventsOnDate,
  isToday,
  isSameDay,
  formatPolishWeekdayShort,
} from "@/lib/calendarDates.js";

const MAX_EVENTS_PER_CELL = 3;

export default function MonthView({ events, currentDate, onEditEvent, onJumpToDay }) {
  const cells = monthGridDates(currentDate); // 42 dates
  // Day names header — generate from the first 7 cells (a full week) so locale is consistent.
  const dayNames = cells.slice(0, 7).map((d) => formatPolishWeekdayShort(d));

  const currentMonth = currentDate.getMonth();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Day-names header */}
      <div className="grid border-b border-border bg-secondary/30" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
        {dayNames.map((name) => (
          <div key={name} className="py-1 text-center text-[10px] font-medium text-muted-foreground">
            {name}
          </div>
        ))}
      </div>

      {/* 6 × 7 grid of date cells */}
      <div className="grid flex-1 overflow-y-auto" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
        {cells.map((cellDate) => {
          const inMonth = cellDate.getMonth() === currentMonth;
          const today = isToday(cellDate);
          const cellEvents = eventsOnDate(events, cellDate);
          const visible = cellEvents.slice(0, MAX_EVENTS_PER_CELL);
          const overflow = cellEvents.length - visible.length;

          return (
            <div
              key={cellDate.toISOString()}
              className={`flex min-h-[68px] flex-col border-b border-r border-border p-1 ${inMonth ? "bg-card" : "bg-secondary/20 text-muted-foreground"} hover:bg-primary/5`}
              onClick={(e) => {
                // Only jump if the click was on the cell background, not on an event pill.
                if (e.target === e.currentTarget) onJumpToDay(cellDate);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onJumpToDay(cellDate);
                }
              }}
              aria-label={`Otwórz widok dnia ${cellDate.getDate()}`}
            >
              <span
                className={
                  today
                    ? "mb-1 flex h-5 w-5 items-center justify-center self-start rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
                    : `mb-1 self-start text-[11px] font-medium ${inMonth ? "text-foreground" : ""}`
                }
              >
                {cellDate.getDate()}
              </span>
              <div className="flex flex-col gap-0.5">
                {visible.map((evt) => {
                  const meta = getEventTypeMeta(evt.event_type);
                  return (
                    <button
                      key={evt.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // Don't trigger the cell's jump.
                        onEditEvent(evt);
                      }}
                      className={`truncate rounded-sm border-l-2 px-1 py-px text-left text-[9px] leading-tight ${meta.iconClass}`}
                      style={{ borderLeftColor: "currentColor" }}
                      aria-label={`Edytuj ${evt.title}`}
                    >
                      {evt.title}
                    </button>
                  );
                })}
                {overflow > 0 && (
                  <span className="text-[9px] text-muted-foreground">+{overflow} więcej</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
