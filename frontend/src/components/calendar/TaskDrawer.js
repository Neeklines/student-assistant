import React, { useState, useEffect, useRef } from "react";
import { Plus, Pencil, X, ChevronDown } from "lucide-react";

const CustomSelect = ({ value, options, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className="relative mb-2.5 w-full" ref={dropdownRef}>
      <button
        type="button"
        className={[
          "flex w-full items-center justify-between rounded-xl border bg-slate-800 px-3 py-2.5 text-left text-white transition",
          isOpen ? "border-indigo-500" : "border-slate-700 hover:border-indigo-500"
        ].join(" ")}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>

        <ChevronDown
          size={16}
          className={[
            "text-slate-500 transition-transform",
            isOpen ? "rotate-180" : ""
          ].join(" ")}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+5px)] z-[999] overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              className={[
                "block w-full px-4 py-3 text-left text-sm text-white transition hover:bg-slate-800",
                value === option.value ? "bg-indigo-950" : ""
              ].join(" ")}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

function TaskDrawer({
  isOpen,
  onClose,
  editingEventId,
  form,
  setForm,
  handleSubmit,
  resetForm
}) {
  const eventTypeOptions = [
    { value: "study", label: "Study" },
    { value: "work", label: "Work" },
    { value: "exam", label: "Exam" },
    { value: "break", label: "Break" },
    { value: "personal", label: "Personal" }
  ];

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" }
  ];

  const inputClass =
    "mb-2.5 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20";

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/65"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          "fixed bottom-0 top-0 z-[120] w-[360px] overflow-y-auto border-l border-slate-700 bg-slate-950 p-6 transition-all duration-300 max-md:w-full",
          isOpen ? "right-0" : "-right-[380px] max-md:-right-full"
        ].join(" ")}
      >
        <div className="mb-7 flex items-center justify-between">
          <h2 className="m-0 text-xl font-semibold text-white">
            {editingEventId ? "Edit task" : "Add task"}
          </h2>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-white transition hover:bg-slate-800"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mb-5 rounded-[20px] border border-slate-700 bg-slate-950 p-4 text-white"
        >
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-white">
            {editingEventId ? <Pencil size={18} /> : <Plus size={18} />}
            {editingEventId ? "Edit task" : "Add task"}
          </h3>

          <input
            className={inputClass}
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <textarea
            className={`${inputClass} min-h-20 resize-y`}
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />

          <input
            className={inputClass}
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />

          <div className="flex gap-2.5">
            <input
              className={inputClass}
              type="time"
              value={form.start}
              onChange={(e) => setForm({ ...form, start: e.target.value })}
            />

            <input
              className={inputClass}
              type="time"
              value={form.end}
              onChange={(e) => setForm({ ...form, end: e.target.value })}
            />
          </div>

          <CustomSelect
            value={form.event_type}
            options={eventTypeOptions}
            placeholder="Select type"
            onChange={(value) => setForm({ ...form, event_type: value })}
          />

          <CustomSelect
            value={form.priority}
            options={priorityOptions}
            placeholder="Select priority"
            onChange={(value) => setForm({ ...form, priority: value })}
          />

          <button
            type="submit"
            className="mt-1 w-full rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 px-4 py-2.5 font-medium text-white transition hover:opacity-90"
          >
            {editingEventId ? "Save changes" : "Add to calendar"}
          </button>

          {editingEventId && (
            <button
              type="button"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-700 px-4 py-2.5 font-medium text-white transition hover:bg-slate-600"
              onClick={resetForm}
            >
              <X size={14} />
              Cancel edit
            </button>
          )}
        </form>

        <div className="rounded-[20px] border border-slate-700 bg-slate-950 p-4 text-white">
          <h3 className="mb-3 font-semibold text-white">AI Planner</h3>

          <textarea
            className="mb-2.5 h-20 w-full resize-y rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
            placeholder="Example: Plan my day. I have classes from 9 to 13 and need 2 hours for Python."
          />

          <button
            type="button"
            className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 font-medium text-white transition hover:opacity-90"
          >
            Generate plan
          </button>
        </div>
      </aside>
    </>
  );
}

export default TaskDrawer;