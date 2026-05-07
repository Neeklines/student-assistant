import { Bot, PanelRightOpen } from "lucide-react";

function CalendarHeader({ onOpenTaskPanel, viewMode, setViewMode }) {
  const viewButtonClass = (mode) =>
    [
      "rounded-xl px-4 py-2 text-sm font-medium transition",
      viewMode === mode
        ? "bg-slate-800 text-white"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    ].join(" ");

  return (
    <header className="mb-6 flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
      <div>
        <h1 className="m-0 text-3xl font-semibold text-white">
          Calendar
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Plan your study, work and personal tasks.
        </p>
      </div>

      <div className="flex items-center gap-3 max-md:w-full max-md:flex-wrap">
        <div className="flex rounded-2xl border border-slate-700 bg-slate-950 p-1 max-md:w-full">
          <button
            type="button"
            className={`${viewButtonClass("month")} max-md:flex-1`}
            onClick={() => setViewMode("month")}
          >
            Month
          </button>

          <button
            type="button"
            className={`${viewButtonClass("week")} max-md:flex-1`}
            onClick={() => setViewMode("week")}
          >
            Week
          </button>

          <button
            type="button"
            className={`${viewButtonClass("day")} max-md:flex-1`}
            onClick={() => setViewMode("day")}
          >
            Day
          </button>
        </div>

        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2.5 font-medium text-white transition hover:bg-slate-700 max-md:flex-1"
          onClick={onOpenTaskPanel}
        >
          <PanelRightOpen size={18} />
          Add task
        </button>

        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 px-4 py-2.5 font-medium text-white transition hover:opacity-90 max-md:flex-1"
        >
          <Bot size={18} />
          Plan with AI
        </button>
      </div>
    </header>
  );
}

export default CalendarHeader;