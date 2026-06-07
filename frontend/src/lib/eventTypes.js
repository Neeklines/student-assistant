import { GraduationCap, BookOpen, AlertCircle, AlarmClock, Coffee, Sparkles } from "lucide-react";

// Single source of truth for event-type metadata. Keys are the canonical
// English values stored in the backend / used by OpenAI tool calling.
// Tailwind classes use the standard color scale so they work in both themes.
export const EVENT_TYPE_META = {
  lecture: {
    label: "Wykład",
    Icon: GraduationCap,
    iconClass: "bg-blue-100 text-blue-700",
    badgeClass: "bg-blue-100 text-blue-700",
  },
  study: {
    label: "Nauka",
    Icon: BookOpen,
    iconClass: "bg-green-100 text-green-700",
    badgeClass: "bg-green-100 text-green-700",
  },
  exam: {
    label: "Egzamin",
    Icon: AlertCircle,
    iconClass: "bg-red-100 text-red-700",
    badgeClass: "bg-red-100 text-red-700",
  },
  deadline: {
    label: "Deadline",
    Icon: AlarmClock,
    iconClass: "bg-orange-100 text-orange-700",
    badgeClass: "bg-orange-100 text-orange-700",
  },
  break: {
    label: "Przerwa",
    Icon: Coffee,
    iconClass: "bg-slate-100 text-slate-600",
    badgeClass: "bg-slate-100 text-slate-600",
  },
  custom: {
    label: "Inne",
    Icon: Sparkles,
    iconClass: "bg-purple-100 text-purple-700",
    badgeClass: "bg-purple-100 text-purple-700",
  },
};

// Ordered list for iterating in selects, preserves the deliberate ordering above.
export const EVENT_TYPE_VALUES = Object.keys(EVENT_TYPE_META);

// Lookup with a safe fallback for unknown types (e.g. legacy events with
// capitalized "Custom" or any future type added by AI before the UI catches up).
export function getEventTypeMeta(type) {
  return EVENT_TYPE_META[type] ?? EVENT_TYPE_META.custom;
}
