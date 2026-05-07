import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";

function WeekView({
  selectedDate,
  events,
  setSelectedDate,
  formatDate,
  formatTime,
  setSelectedEvent,
  editEvent,
  deleteEvent
}) {
  const eventTypeStyles = {
    study: "bg-indigo-100 border-indigo-500",
    work: "bg-cyan-100 border-cyan-500",
    exam: "bg-red-100 border-red-500",
    break: "bg-emerald-100 border-emerald-500",
    personal: "bg-amber-100 border-amber-500"
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

  function getWeekStart(dateString) {
    const date = parseLocalDate(dateString);
    const day = date.getDay() === 0 ? 6 : date.getDay() - 1;

    date.setDate(date.getDate() - day);
    return date;
  }

  function changeWeek(offset) {
    const date = parseLocalDate(selectedDate);

    date.setDate(date.getDate() + offset * 7);
    setSelectedDate(getDateString(date));
  }

  function goToToday() {
    setSelectedDate(getDateString(new Date()));
  }

  function getWeekDays() {
    const start = getWeekStart(selectedDate);

    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start);

      day.setDate(start.getDate() + index);

      return {
        date: day,
        dateString: getDateString(day),
        label: day.toLocaleDateString("en-US", {
          weekday: "short"
        }),
        dayNumber: day.getDate(),
        isToday: getDateString(day) === getDateString(new Date()),
        isSelected: getDateString(day) === selectedDate
      };
    });
  }

  function getEventsForDay(dateString) {
    return events
      .filter((event) => getDateString(event.start_time) === dateString)
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }

  const weekDays = getWeekDays();

  return (
    <section className="min-h-[calc(100vh-150px)] rounded-[20px] bg-slate-950 p-4">
      <div className="mb-4 flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
        <div>
          <h3 className="m-0 text-lg font-medium text-white">
            Week of {formatDate(weekDays[0].dateString)}
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Weekly overview of your tasks
          </p>
        </div>

        <div className="flex gap-2 max-md:w-full">
          <button
            type="button"
            className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white transition hover:bg-slate-700 max-md:flex-1"
            onClick={() => changeWeek(-1)}
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
            onClick={() => changeWeek(1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-230px)] grid-cols-7 gap-px overflow-hidden rounded-[18px] border border-slate-700 bg-slate-700 max-md:grid-cols-1">
        {weekDays.map((day) => {
          const dayEvents = getEventsForDay(day.dateString);

          return (
            <div
              className={[
                "min-h-[620px] cursor-pointer bg-slate-950 p-3 transition hover:bg-slate-900 max-md:min-h-0",
                day.isToday ? "shadow-[inset_0_0_0_2px_#22c55e]" : "",
                day.isSelected ? "shadow-[inset_0_0_0_2px_#6366f1]" : ""
              ].join(" ")}
              key={day.dateString}
              onClick={() => setSelectedDate(day.dateString)}
            >
              <div className="mb-3 flex flex-col gap-1 text-white">
                <span className="text-xs font-semibold text-slate-400">
                  {day.label}
                </span>

                <strong className="text-2xl font-semibold">
                  {day.dayNumber}
                </strong>

                <small className="text-[11px] text-slate-400">
                  {dayEvents.length} task(s)
                </small>
              </div>

              <div className="flex flex-col gap-2">
                {dayEvents.length === 0 && (
                  <p className="m-0 text-xs text-slate-500">
                    No tasks
                  </p>
                )}

                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className={[
                      "cursor-pointer overflow-hidden rounded-xl border-l-4 p-2.5 text-slate-900 transition hover:brightness-105",
                      eventTypeStyles[event.event_type] ||
                        "bg-indigo-100 border-indigo-500"
                    ].join(" ")}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                    }}
                  >
                    <strong className="mb-1 block text-sm font-semibold">
                      {event.title}
                    </strong>

                    <span className="block text-xs text-slate-700">
                      {formatTime(event.start_time)} -{" "}
                      {formatTime(event.end_time)}
                    </span>

                    <small className="mt-1 block text-[11px] text-slate-500">
                      {event.event_type} · {event.priority}
                    </small>

                    <div className="mt-2 flex gap-1.5">
                      <button
                        type="button"
                        className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2 py-1 text-[11px] font-medium text-white transition hover:bg-indigo-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          editEvent(event);
                        }}
                      >
                        <Pencil size={12} />
                        Edit
                      </button>

                      <button
                        type="button"
                        className="rounded-lg bg-red-500 px-2 py-1 text-[11px] font-medium text-white transition hover:bg-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteEvent(event.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default WeekView;