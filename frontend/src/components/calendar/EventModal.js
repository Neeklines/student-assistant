import { Pencil, X } from "lucide-react";

function EventModal({
  event,
  onClose,
  formatDate,
  formatTime,
  editEvent,
  deleteEvent
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[460px] overflow-hidden rounded-3xl border border-slate-700 bg-slate-950 p-6 text-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-4 top-4 flex h-[34px] w-[34px] items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-white transition hover:bg-slate-700"
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <h2 className="m-0 mb-3 mr-10 text-2xl font-semibold text-white">
          {event.title}
        </h2>

        <p className="mb-5 max-h-[140px] overflow-y-auto whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-300">
          {event.description || "No description provided."}
        </p>

        <div className="mb-5 grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-3">
            <span className="mb-1 block text-xs text-slate-400">Date</span>
            <strong className="text-sm text-white">
              {formatDate(event.start_time)}
            </strong>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-3">
            <span className="mb-1 block text-xs text-slate-400">Time</span>
            <strong className="text-sm text-white">
              {formatTime(event.start_time)} - {formatTime(event.end_time)}
            </strong>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-3">
            <span className="mb-1 block text-xs text-slate-400">Category</span>
            <strong className="text-sm text-white">
              {event.event_type}
            </strong>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-3">
            <span className="mb-1 block text-xs text-slate-400">Priority</span>
            <strong className="text-sm text-white">
              {event.priority}
            </strong>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-3">
            <span className="mb-1 block text-xs text-slate-400">Created by</span>
            <strong className="text-sm text-white">
              {event.created_by}
            </strong>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-3">
            <span className="mb-1 block text-xs text-slate-400">Status</span>
            <strong className="text-sm text-white">
              {event.status}
            </strong>
          </div>
        </div>

        <div className="flex gap-2.5 max-sm:flex-col">
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-500"
            onClick={() => editEvent(event)}
          >
            <Pencil size={14} />
            Edit task
          </button>

          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 font-medium text-white transition hover:bg-red-400"
            onClick={() => deleteEvent(event.id)}
          >
            Delete task
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventModal;