import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles, CalendarDays, Send, Plus, Bell, Clock, GraduationCap, LogOut, Home as HomeIcon,
} from "lucide-react";
import { Button, Card, Input, Badge } from "@/components/ui.jsx";

const STARTER_MESSAGES = [
  { role: "ai", text: "Cześć! Co masz dziś na głowie? Mogę zaplanować Twój tydzień." },
];

const STARTER_EVENTS = [
  { id: "1", title: "Analiza matematyczna — wykład", time: "Pon · 09:00", tag: "Zajęcia" },
  { id: "2", title: "Nauka: Algebra liniowa", time: "Pon · 16:00", tag: "Focus" },
  { id: "3", title: "Projekt grupowy — spotkanie", time: "Wt · 18:30", tag: "Spotkanie" },
  { id: "4", title: "Oddanie szkicu eseju", time: "Pt · 23:59", tag: "Deadline" },
];

export default function Dashboard() {
  const [messages, setMessages] = useState(STARTER_MESSAGES);
  const [input, setInput] = useState("");
  const [events, setEvents] = useState(STARTER_EVENTS);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setMessages((m) => [...m, { role: "user", text: userText }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [...m, { role: "ai", text: `Świetnie — „${userText}". Dodaję sesję focusu i przypomnienie.` }]);
    }, 700);
  };

  const addEvent = () => {
    if (!title.trim() || !time.trim()) return;
    setEvents((e) => [...e, { id: crypto.randomUUID(), title, time, tag: "Custom" }]);
    setTitle(""); setTime("");
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
            <Link to="/"><Button variant="outline" size="sm"><LogOut className="mr-2 h-4 w-4" />Wyloguj</Button></Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Cześć, Janek 👋</h1>
          <p className="text-muted-foreground">Oto Twój plan na ten tydzień.</p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="p-5"><p className="text-sm text-muted-foreground">Wydarzenia w tym tygodniu</p><p className="mt-1 text-3xl font-bold text-foreground">{events.length}</p></Card>
          <Card className="p-5"><p className="text-sm text-muted-foreground">Sesje nauki</p><p className="mt-1 text-3xl font-bold text-foreground">5</p></Card>
          <Card className="p-5"><p className="text-sm text-muted-foreground">Najbliższy deadline</p><p className="mt-1 text-3xl font-bold text-foreground">Pt</p></Card>
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
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-secondary-foreground rounded-bl-sm"}`}>{m.text}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t border-border p-3">
              <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Napisz do Buddy'ego…" />
              <Button onClick={send} size="icon" style={{ background: "var(--gradient-hero)", color: "white" }}><Send className="h-4 w-4" /></Button>
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
              {events.map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/40">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.time}</p>
                  </div>
                  <Badge variant="secondary">{e.tag}</Badge>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-t border-border p-3">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nowe wydarzenie…" />
              <Input value={time} onChange={(e) => setTime(e.target.value)} placeholder="Śr · 14:00" className="w-32" />
              <Button onClick={addEvent} size="icon" variant="outline"><Plus className="h-4 w-4" /></Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}