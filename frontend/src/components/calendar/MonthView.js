import { ChevronLeft, ChevronRight } from "lucide-react";

function MonthView({
  selectedDate,
  events,
  setSelectedDate,
  setViewMode,
  formatTime
}) {
  const eventTypeStyles = {
    study: "bg-indigo-100",
    work: "bg-cyan-100",
    exam: "bg-red-100",
    break: "bg-emerald-100",
    personal: "bg-amber-100"
  };

  function getDateString(value) {
    const d = value instanceof Date ? value : new Date(value);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function parseLocalDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function changeMonth(offset) {
    const date = parseLocalDate(selectedDate);
    date.setMonth(date.getMonth() + offset);
    setSelectedDate(getDateString(date));
  }

  function goToToday() {
    setSelectedDate(getDateString(new Date()));
  }

  function getMonthDays() {
    const selected = parseLocalDate(selectedDate);

    const year = selected.getFullYear();
    const month = selected.getMonth();

    const firstDay = new Date(year, month, 1);
    const firstWeekday = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const calendarStart = new Date(firstDay);
    calendarStart.setDate(firstDay.getDate() - firstWeekday);

    const days = [];

    for (let i = 0; i < 42; i++) {
      const day = new Date(calendarStart);
      day.setDate(calendarStart.getDate() + i);

      const dateString = getDateString(day);

      days.push({
        date: day,
        dateString,
        isCurrentMonth: day.getMonth() === month,
        isToday: dateString === getDateString(new Date()),
        isSelected: dateString === selectedDate
      });
    }

    return {
      title: firstDay.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
      }),
      days
    };
  }

  function getEventsForDay(dateString) {
    return events
      .filter((event) => getDateString(event.start_time) === dateString)
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const monthData = getMonthDays();

  return (
    <section className="min-h-[calc(100vh-150px)] rounded-[20px] bg-slate-950 p-4">
      <div className="mb-4 flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
        <div>
          <h3 className="m-0 text-lg font-medium text-white">
            {monthData.title}
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Monthly overview of your plans
          </p>
        </div>

        <div className="flex gap-2 max-md:w-full">
          <button
            type="button"
            className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white transition hover:bg-slate-700 max-md:flex-1"
            onClick={() => changeMonth(-1)}
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white transition hover:bg-slate-700 max-md:flex-1"
            onClick={goToToday}
          >
            Today
          </button>

          <button
            type="button"
            className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white transition hover:bg-slate-700 max-md:flex-1"
            onClick={() => changeMonth(1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-230px)] grid-cols-7 overflow-hidden rounded-[18px] border border-slate-700 bg-slate-700 max-md:min-h-[calc(100vh-260px)]">
        {weekdays.map((day) => (
          <div
            className="border-b border-r border-slate-700 bg-slate-900 p-3 text-center text-sm font-semibold text-slate-400 max-md:px-1 max-md:py-2 max-md:text-[11px]"
            key={day}
          >
            {day}
          </div>
        ))}

        {monthData.days.map((day) => {
          const dayEvents = getEventsForDay(day.dateString);

          return (
            <button
              type="button"
              key={day.dateString}
              className={[
                "min-h-[118px] overflow-hidden border-b border-r border-slate-700 bg-slate-950 p-2.5 text-left text-white transition hover:bg-slate-900 max-md:min-h-[88px] max-md:p-1.5",
                !day.isCurrentMonth ? "bg-slate-950/60 text-slate-500" : "",
                day.isToday ? "shadow-[inset_0_0_0_2px_#6366f1] bg-emerald-500/10" : "",
                day.isSelected ? "bg-slate-900" : ""
              ].join(" ")}
              onClick={() => {
                setSelectedDate(day.dateString);
                setViewMode("day");
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {day.date.getDate()}
                </span>

                {dayEvents.length > 0 && (
                  <small className="text-[11px] text-slate-400 max-md:hidden">
                    {dayEvents.length} task(s)
                  </small>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    className={[
                      "flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] text-slate-900 max-md:px-1.5 max-md:py-1",
                      eventTypeStyles[event.event_type] || "bg-indigo-100"
                    ].join(" ")}
                    key={event.id}
                  >
                    <span className="shrink-0 font-semibold opacity-75 max-md:hidden">
                      {formatTime(event.start_time)}
                    </span>

                    <strong className="truncate">
                      {event.title}
                    </strong>
                  </div>
                ))}

                {dayEvents.length > 3 && (
                  <div className="pl-0.5 text-[11px] text-slate-400">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default MonthView;