import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui.jsx";
import DayView from "@/components/calendar/DayView.jsx";
import WeekView from "@/components/calendar/WeekView.jsx";
import {
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  addMonths,
  formatPolishWeekday,
  formatDayMonth,
  formatMonthYear,
  eventsOnDate,
  eventsInRange,
  startOfMonth,
  endOfMonth,
} from "@/lib/calendarDates.js";

const TABS = [
  { id: "day", label: "Dzień" },
  { id: "week", label: "Tydzień" },
  { id: "month", label: "Miesiąc" },
];

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function formatHeaderTitle(perspective, currentDate) {
  if (perspective === "day") {
    // "Środa, 7 czerwca 2026"
    const weekday = capitalize(formatPolishWeekday(currentDate));
    const dayMonth = formatDayMonth(currentDate);
    const year = currentDate.getFullYear();
    return `${weekday}, ${dayMonth} ${year}`;
  }
  if (perspective === "week") {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    const sameMonth = start.getMonth() === end.getMonth();
    if (sameMonth) {
      // "3 – 9 czerwca 2026"
      return `${start.getDate()} – ${end.getDate()} ${formatDayMonth(end).split(" ").slice(1).join(" ")} ${end.getFullYear()}`;
    }
    // "30 czerwca – 6 lipca 2026"
    return `${formatDayMonth(start)} – ${formatDayMonth(end)} ${end.getFullYear()}`;
  }
  // month
  return formatMonthYear(currentDate);
}

export default function CalendarView({ events, onEditEvent }) {
  const [perspective, setPerspective] = useState("week");
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const goPrev = () => {
    if (perspective === "day") setCurrentDate((d) => addDays(d, -1));
    else if (perspective === "week") setCurrentDate((d) => addWeeks(d, -1));
    else setCurrentDate((d) => addMonths(d, -1));
  };

  const goNext = () => {
    if (perspective === "day") setCurrentDate((d) => addDays(d, 1));
    else if (perspective === "week") setCurrentDate((d) => addWeeks(d, 1));
    else setCurrentDate((d) => addMonths(d, 1));
  };

  const goToday = () => setCurrentDate(new Date());

  // Pre-filter events for the placeholder body's count. Real views will filter themselves.
  let visibleEvents = [];
  if (perspective === "day") {
    visibleEvents = eventsOnDate(events, currentDate);
  } else if (perspective === "week") {
    visibleEvents = eventsInRange(events, startOfWeek(currentDate), endOfWeek(currentDate));
  } else {
    visibleEvents = eventsInRange(events, startOfMonth(currentDate), endOfMonth(currentDate));
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header: title + navigation */}
      <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-4 py-3">
        <p className="text-sm font-semibold text-foreground">{formatHeaderTitle(perspective, currentDate)}</p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={goPrev} aria-label="Poprzedni">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            Dziś
          </Button>
          <Button variant="outline" size="sm" onClick={goNext} aria-label="Następny">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border bg-secondary/20 px-3 py-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setPerspective(tab.id)}
            className={
              perspective === tab.id
                ? "rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                : "rounded-md px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary"
            }
            aria-pressed={perspective === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body */}
      {perspective === "day" && (
        <DayView events={events} currentDate={currentDate} onEditEvent={onEditEvent} />
      )}
      {perspective === "week" && (
        <WeekView events={events} currentDate={currentDate} onEditEvent={onEditEvent} />
      )}
      {perspective === "month" && (
        <div className="flex-1 overflow-auto p-4">
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            <p><strong>Miesiąc</strong></p>
            <p className="mt-1">Wydarzeń w zakresie: <strong>{visibleEvents.length}</strong></p>
            <p className="mt-3 text-xs">MonthView dojedzie w kolejnym commicie (Task E).</p>
          </div>
        </div>
      )}
    </div>
  );
}
