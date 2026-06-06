import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles, CalendarDays, Send, Plus, Bell, Clock, GraduationCap, LogOut, Home as HomeIcon,
  Paperclip, X,
} from "lucide-react";
import { Button, Card, Input, Badge } from "@/components/ui.jsx";
import { useAuth } from "@/context/AuthContext.jsx";
import * as chatService from "@/services/chatService.js";
import * as calendarService from "@/services/calendarService.js";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const EVENT_TIME_FORMATTER = new Intl.DateTimeFormat("pl-PL", {
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function formatEventTime(isoString) {
  try {
    return EVENT_TIME_FORMATTER.format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([
    { role: "ai", text: "Cześć! Co masz dziś na głowie? Mogę zaplanować Twój tydzień." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState(null);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const pickImage = (file) => {
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setChatError("Dozwolone formaty: JPEG, PNG, WebP.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setChatError("Obraz jest większy niż 5MB.");
      return;
    }
    setChatError(null);
    setImageFile(file);
  };

  const clearImage = () => {
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setEventsLoading(true);
    calendarService.getEvents(token)
      .then((data) => { if (!cancelled) setEvents(data); })
      .catch((e) => { if (!cancelled) setEventsError(e.message); })
      .finally(() => { if (!cancelled) setEventsLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  const send = async () => {
    if (sending) return;
    const userText = input.trim();
    if (!userText && !imageFile) return;
    const attachedImage = imageFile;
    const attachedPreview = imagePreview;
    setMessages((m) => [
      ...m,
      { role: "user", text: userText, imageUrl: attachedPreview },
    ]);
    setInput("");
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSending(true);
    setChatError(null);
    try {
      const sessionId = chatService.getOrCreateSessionId();
      const { response } = await chatService.sendMessage(
        token,
        sessionId,
        userText,
        attachedImage,
      );
      setMessages((m) => [...m, { role: "ai", text: response }]);
      // Buddy may have created/updated/deleted events via tool calling — refresh.
      try {
        const fresh = await calendarService.getEvents(token);
        setEvents(fresh);
      } catch {
        // Non-fatal: chat reply already shown.
      }
    } catch (e) {
      setChatError(e.message);
      setMessages((m) => [...m, { role: "ai", text: `Błąd: ${e.message}` }]);
    } finally {
      setSending(false);
    }
  };

  const addEvent = async () => {
    if (!title.trim() || !startTime.trim()) return;
    setEventsError(null);
    try {
      const start = new Date(startTime);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const created = await calendarService.createEvent(token, {
        title,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        event_type: "Custom",
      });
      setEvents((e) => [...e, created]);
      setTitle("");
      setStartTime("");
    } catch (e) {
      setEventsError(e.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--gradient-hero)" }}>
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Studybuddy</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/"><Button variant="ghost" size="sm"><HomeIcon className="mr-2 h-4 w-4" />Strona główna</Button></Link>
            <Button variant="outline" size="sm" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" />Wyloguj</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Cześć, {user?.email ?? "Studencie"} 👋</h1>
          <p className="text-muted-foreground">Oto Twój plan na ten tydzień.</p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="p-5"><p className="text-sm text-muted-foreground">Wydarzenia w tym tygodniu</p><p className="mt-1 text-3xl font-bold text-foreground">{events.length}</p></Card>
          <Card className="p-5"><p className="text-sm text-muted-foreground">Sesje nauki</p><p className="mt-1 text-3xl font-bold text-foreground">—</p></Card>
          <Card className="p-5"><p className="text-sm text-muted-foreground">Najbliższy deadline</p><p className="mt-1 text-3xl font-bold text-foreground">—</p></Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="flex h-[560px] flex-col overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-3 border-b border-border bg-secondary/40 px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "var(--gradient-hero)" }}>
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Buddy</p>
                <p className="text-xs text-muted-foreground">Asystent AI · online</p>
              </div>
            </div>
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-5">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] space-y-2 rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-secondary-foreground rounded-bl-sm"}`}>
                    {m.imageUrl && (
                      <img src={m.imageUrl} alt="Załącznik" className="max-h-48 rounded-lg object-cover" />
                    )}
                    {m.text && <div>{m.text}</div>}
                  </div>
                </div>
              ))}
              {sending && <p className="text-xs text-muted-foreground">Buddy pisze…</p>}
              {chatError && <p className="text-xs text-red-600">{chatError}</p>}
            </div>
            <div className="space-y-2 border-t border-border p-3">
              {imagePreview && (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Podgląd" className="h-20 w-20 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background shadow"
                    aria-label="Usuń obraz"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => pickImage(e.target.files?.[0])}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                  size="icon"
                  variant="outline"
                  aria-label="Dodaj obraz"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Napisz do Buddy'ego…" disabled={sending} />
                <Button onClick={send} disabled={sending} size="icon" style={{ background: "var(--gradient-hero)", color: "white" }}><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>

          <Card className="flex h-[560px] flex-col overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent">
                  <CalendarDays className="h-4 w-4 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Twój kalendarz</p>
                  <p className="text-xs text-muted-foreground">{events.length} pozycji</p>
                </div>
              </div>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {eventsLoading && <p className="text-sm text-muted-foreground">Ładowanie…</p>}
              {eventsError && <p className="text-sm text-red-600">{eventsError}</p>}
              {!eventsLoading && !eventsError && events.length === 0 && (
                <p className="text-sm text-muted-foreground">Brak wydarzeń. Dodaj pierwsze poniżej.</p>
              )}
              {events.map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/40">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{formatEventTime(e.start_time)}</p>
                  </div>
                  <Badge variant="secondary">{e.event_type || "—"}</Badge>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-t border-border p-3">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nowe wydarzenie…" />
              <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-44" />
              <Button onClick={addEvent} size="icon" variant="outline"><Plus className="h-4 w-4" /></Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
