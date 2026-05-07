import { X, Menu } from "lucide-react";

function CalendarSidebar({ isSidebarOpen, setIsSidebarOpen }) {
  return (
    <>
      <button
        type="button"
        className="fixed left-5 top-5 z-[80] flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950 text-white transition hover:bg-slate-800"
        onClick={() => setIsSidebarOpen(true)}
      >
        <Menu size={22} />
      </button>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/65"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={[
          "fixed bottom-0 top-0 z-[120] w-60 bg-slate-950 p-6 text-white transition-all duration-300",
          isSidebarOpen ? "left-0" : "-left-72"
        ].join(" ")}
      >
        <div className="mb-7 flex items-center justify-between">
          <h2 className="m-0 text-xl font-semibold">
            Student Assistant
          </h2>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-white transition hover:bg-slate-800"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <button className="mb-2 w-full rounded-xl bg-slate-800 px-3 py-3 text-white transition">
          Calendar
        </button>

        <button className="mb-2 w-full rounded-xl px-3 py-3 text-slate-400 transition hover:bg-slate-800 hover:text-white">
          Chat
        </button>

        <button className="mb-2 w-full rounded-xl px-3 py-3 text-slate-400 transition hover:bg-slate-800 hover:text-white">
          Goals
        </button>

        <button className="mb-2 w-full rounded-xl px-3 py-3 text-slate-400 transition hover:bg-slate-800 hover:text-white">
          Settings
        </button>
      </aside>
    </>
  );
}

export default CalendarSidebar;