import { Pencil, ChevronLeft, ChevronRight } from "lucide-react";

function DayView({
  selectedDate,
  visibleEvents,
  formatDate,
  formatTime,
  minutesFromDayStart,
  changeDay,
  goToToday,
  setSelectedEvent,
  editEvent,
  deleteEvent,
  dayStartHour,
  dayEndHour,
  hourHeight
}) {
  const eventTypeStyles = {
    study: "bg-indigo-100 border-indigo-500",
    work: "bg-cyan-100 border-cyan-500",
    exam: "bg-red-100 border-red-500",
    break: "bg-emerald-100 border-emerald-500",
    personal: "bg-amber-100 border-amber-500"
  };

  const hours = Array.from(
    { length: dayEndHour - dayStartHour + 1 },
    (_, i) => dayStartHour + i
  );

  return (
    <div className="block">
      <section className="w-full rounded-[20px] bg-slate-950 p-4">
        <div className="mb-3 flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
          <div>
            <h3 className="m-0 text-lg font-medium text-white">
              {formatDate(selectedDate)}
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              {visibleEvents.length} task(s) planned
            </p>
          </div>

          <div className="flex gap-2 max-md:w-full">
            <button
              type="button"
              className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white transition hover:bg-slate-700 max-md:flex-1"
              onClick={() => changeDay(-1)}
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
              onClick={() => changeDay(1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div
          className="relative overflow-hidden rounded-[20px] bg-slate-800"
          style={{ height: `${hours.length * hourHeight}px` }}
        >
          {hours.map((hour) => (
            <div
              className="grid h-[60px] grid-cols-[70px_1fr] items-start border-b border-slate-700"
              key={hour}
            >
              <div className="pl-2.5 pt-2.5 text-sm font-medium text-slate-400">
                {hour}:00
              </div>

              <div className="mr-3 mt-[30px] border-t border-slate-700" />
            </div>
          ))}

          <div className="absolute bottom-0 left-[70px] right-3 top-0">
            {visibleEvents.map((event) => {
              const top = minutesFromDayStart(event.start_time);

              const duration =
                (new Date(event.end_time) - new Date(event.start_time)) /
                60000;

              const height = Math.max(duration, 48);

              return (
                <div
                  key={event.id}
                  className={[
                    "absolute z-[2] min-h-[48px] cursor-pointer overflow-hidden rounded-2xl border-l-4 px-4 py-3 pb-9 text-sm text-slate-900 shadow-lg transition hover:z-[10] hover:brightness-105",
                    eventTypeStyles[event.event_type] ||
                      "bg-indigo-100 border-indigo-500"
                  ].join(" ")}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    left: "8px",
                    right: "12px"
                  }}
                  onClick={() => setSelectedEvent(event)}
                >
                  <strong className="block font-semibold">
                    {event.title}
                  </strong>

                  <span className="text-xs text-slate-700">
                    {formatTime(event.start_time)} -{" "}
                    {formatTime(event.end_time)}
                  </span>

                  <small className="block text-[11px] text-slate-500">
                    {event.event_type} · {event.priority} ·{" "}
                    {event.created_by}
                  </small>

                  <div className="absolute bottom-2 right-2 flex gap-1.5">
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
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export default DayView;