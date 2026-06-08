import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";

const LEAD_MINUTES = 15;
const POLL_MS = 60_000;
const AUTO_DISMISS_MS = 10_000;

function ToastItem({ toast, onClose }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const timer = setTimeout(() => onCloseRef.current(), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="flex items-start gap-3 rounded-xl border border-border bg-card p-3"
      style={{ boxShadow: "var(--shadow-card)" }}
      role="status"
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ background: "var(--gradient-hero)" }}
      >
        <Bell className="h-4 w-4 text-primary-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">Za {toast.minutesUntil} min</p>
        <p className="truncate text-xs text-muted-foreground">{toast.title}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
        aria-label="Zamknij powiadomienie"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function UpcomingEventToasts({ events }) {
  const [toasts, setToasts] = useState([]);
  const notifiedRef = useRef(new Set());

  useEffect(() => {
    const check = () => {
      const now = Date.now();
      events.forEach((e) => {
        if (!e.start_time || notifiedRef.current.has(e.id)) return;
        const minutesUntil = (new Date(e.start_time).getTime() - now) / 60000;
        if (minutesUntil > 0 && minutesUntil <= LEAD_MINUTES) {
          notifiedRef.current.add(e.id);
          setToasts((t) => [
            ...t,
            { id: e.id, title: e.title, minutesUntil: Math.ceil(minutesUntil) },
          ]);
        }
      });
    };
    check();
    const interval = setInterval(check, POLL_MS);
    return () => clearInterval(interval);
  }, [events]);

  const dismiss = (toastId) =>
    setToasts((t) => t.filter((toast) => toast.id !== toastId));

  return (
    <div className="fixed right-4 top-20 z-50 flex w-72 flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => dismiss(toast.id)} />
      ))}
    </div>
  );
}
