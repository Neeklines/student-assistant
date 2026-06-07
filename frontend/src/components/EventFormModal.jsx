import { useEffect, useState } from "react";
import { Button, Input, Label, Modal } from "@/components/ui.jsx";

const EVENT_TYPES = ["lecture", "study", "exam", "deadline", "break", "custom"];

function pad(n) { return String(n).padStart(2, "0"); }

// ISO → "YYYY-MM-DDTHH:mm" in local TZ for datetime-local input.
function isoToLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// "YYYY-MM-DDTHH:mm" (local) → ISO UTC.
function localInputToIso(local) {
  return new Date(local).toISOString();
}

function emptyForm() {
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
  return {
    title: "",
    description: "",
    start_time: isoToLocalInput(now.toISOString()),
    end_time: isoToLocalInput(inOneHour.toISOString()),
    event_type: "study",
  };
}

function formFromEvent(event) {
  return {
    title: event.title ?? "",
    description: event.description ?? "",
    start_time: isoToLocalInput(event.start_time),
    end_time: isoToLocalInput(event.end_time),
    event_type: event.event_type || "study",
  };
}

export default function EventFormModal({ open, mode, initialEvent, onSubmit, onClose }) {
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    setFormError(null);
    setSubmitting(false);
    setForm(mode === "edit" && initialEvent ? formFromEvent(initialEvent) : emptyForm());
  }, [open, mode, initialEvent]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!form.title.trim()) {
      setFormError("Tytuł nie może być pusty");
      return;
    }
    const startIso = localInputToIso(form.start_time);
    const endIso = localInputToIso(form.end_time);
    if (new Date(endIso) <= new Date(startIso)) {
      setFormError("Koniec musi być po początku");
      return;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      start_time: startIso,
      end_time: endIso,
      event_type: form.event_type,
      priority: initialEvent?.priority ?? "medium",
      status: initialEvent?.status ?? "planned",
      created_by: initialEvent?.created_by ?? "manual",
    };
    setSubmitting(true);
    setFormError(null);
    try {
      await onSubmit(payload);
      // Parent closes the modal via onClose after a successful refetch.
    } catch (err) {
      setFormError(err.message || "Nie udało się zapisać");
    } finally {
      setSubmitting(false);
    }
  };

  const titleId = "event-form-modal-title";

  return (
    <Modal open={open} onClose={submitting ? undefined : onClose} labelledBy={titleId}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <h2 id={titleId} className="text-lg font-semibold text-foreground">
          {mode === "edit" ? "Edytuj wydarzenie" : "Nowe wydarzenie"}
        </h2>

        <div className="space-y-1">
          <Label htmlFor="event-title">Tytuł</Label>
          <Input
            id="event-title"
            value={form.title}
            onChange={update("title")}
            placeholder="np. Algebra liniowa — wykład"
            autoFocus
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="event-description">Opis (opcjonalnie)</Label>
          <textarea
            id="event-description"
            value={form.description}
            onChange={update("description")}
            rows={2}
            className="flex w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/50"
            placeholder="Notatki, sala, materiały…"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="event-start">Start</Label>
            <Input
              id="event-start"
              type="datetime-local"
              value={form.start_time}
              onChange={update("start_time")}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="event-end">Koniec</Label>
            <Input
              id="event-end"
              type="datetime-local"
              value={form.end_time}
              onChange={update("end_time")}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="event-type">Typ</Label>
          <select
            id="event-type"
            value={form.event_type}
            onChange={update("event_type")}
            className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/50"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Anuluj
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Zapisuję…" : mode === "edit" ? "Zapisz zmiany" : "Dodaj"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
