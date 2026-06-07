import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Sparkles, CalendarDays, MessageCircle, BookOpen, Clock, Send, Plus, Bell,
  CheckCircle2, GraduationCap,
} from "lucide-react";
import { Button, Card, Input, Badge, Label, Modal } from "@/components/ui.jsx";
import heroImg from "@/assets/hero-ai-student.jpg";
import { useAuth } from "@/context/AuthContext.jsx";
import * as calendarService from "@/services/calendarService.js";
import { loadGoogleIdentityScript } from "@/services/googleIdentityService.js";

const STARTER_MESSAGES = [
  { role: "ai", text: "Cześć 👋 Jestem Buddy, Twój asystent AI do nauki. Co masz w planach na ten tydzień?" },
];

const FEATURES = [
  { icon: MessageCircle, title: "Planowanie przez rozmowę", desc: "Po prostu powiedz Buddy'emu, co Cię czeka — egzaminy, eseje, spotkania koła naukowego — a on ułoży Twój tydzień." },
  { icon: CalendarDays, title: "Synchronizacja kalendarza", desc: "Czyta Twój Google Calendar i sam dopisuje bloki nauki oraz przypomnienia." },
  { icon: BookOpen, title: "Bloki nauki", desc: "Inteligentne sesje focusu z przerwami, dopasowane do Twoich zajęć." },
  { icon: Bell, title: "Radar terminów", desc: "Nie przegapisz deadline'u — Buddy przypomni Ci wieczorem dzień wcześniej i poda checklistę." },
  { icon: GraduationCap, title: "Stworzone dla studentów", desc: "Rozumie semestry, sylabusy i chaos projektów grupowych." },
  { icon: Sparkles, title: "Codzienne check-iny", desc: "Poranne podsumowanie i wieczorny przegląd, żeby utrzymać tempo." },
];

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

function Hero({ onAuth }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-90" style={{ background: "var(--gradient-soft)" }} />
      <div className="absolute -top-32 -right-32 -z-10 h-96 w-96 rounded-full blur-3xl opacity-40" style={{ background: "var(--gradient-hero)" }} />
      <div className="container mx-auto grid gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
        <div className="flex flex-col justify-center">
          <Badge className="mb-6 w-fit gap-1.5 bg-secondary text-secondary-foreground">
            <Sparkles className="mr-1 h-3.5 w-3.5" /> AI stworzone dla studentów
          </Badge>
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-foreground lg:text-6xl">
            Twoje studia,{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-hero)" }}>
              wreszcie poukładane.
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            Studybuddy rozmawia z Tobą o nadchodzącym tygodniu, synchronizuje się z Twoim kalendarzem i zamienia rozproszone terminy w plan, którego naprawdę się trzymasz.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => onAuth("register")} style={{ background: "var(--gradient-hero)", color: "white", boxShadow: "var(--shadow-glow)" }}>
              Zacznij rozmowę za darmo
            </Button>
            <Button size="lg" variant="outline" onClick={() => onAuth("login")}>
              <CalendarDays className="mr-2 h-4 w-4" /> Połącz kalendarz
            </Button>
          </div>
          <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Bez karty</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Działa z Google Calendar</div>
          </div>
        </div>
        <div className="relative">
          <img src={heroImg} alt="Asystent AI dla studenta" className="rounded-3xl object-cover" style={{ boxShadow: "var(--shadow-card)" }} />
        </div>
      </div>
    </section>
  );
}

function ChatPanel({ onRequireAuth }) {
  const [messages, setMessages] = useState(STARTER_MESSAGES);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);
  const send = () => {
    if (!input.trim()) return;
    onRequireAuth();
  };
  return (
    <Card className="flex h-[520px] flex-col overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
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
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-secondary-foreground rounded-bl-sm"}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-border p-3">
        <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Zaloguj się, by porozmawiać z Buddym…" />
        <Button onClick={send} size="icon" style={{ background: "var(--gradient-hero)", color: "white" }}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

function CalendarPanel() {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setEvents([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    calendarService.getEvents(token)
      .then((data) => { if (!cancelled) setEvents(data); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  const add = async () => {
    if (!title.trim() || !startTime.trim()) return;
    if (!token) { setError("Zaloguj się, by dodać wydarzenie"); return; }
    setError(null);
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
      setError(e.message);
    }
  };

  return (
    <Card className="flex h-[520px] flex-col overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent">
            <CalendarDays className="h-4 w-4 text-accent-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Ten tydzień</p>
            <p className="text-xs text-muted-foreground">
              {token ? `${events.length} zaplanowanych pozycji` : "Zaloguj się, by zobaczyć kalendarz"}
            </p>
          </div>
        </div>
        <Bell className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {loading && <p className="text-sm text-muted-foreground">Ładowanie…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && events.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {token ? "Brak wydarzeń. Dodaj pierwsze poniżej." : "Zaloguj się, by zobaczyć swoje wydarzenia."}
          </p>
        )}
        {events.map((e) => (
          <div key={e.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/40">
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
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nowe wydarzenie…" disabled={!token} />
        <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-44" disabled={!token} />
        <Button onClick={add} size="icon" variant="outline" disabled={!token}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

function AuthDialog({ mode, onClose, onSwitch, onSuccess }) {
  const { login, register, googleLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const googleButtonRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    setEmail("");
    setPassword("");
    setName("");
    setError(null);
    setSubmitting(false);
  }, [mode]);

  useEffect(() => {
    if (!mode || !googleClientId || !googleButtonRef.current) return;

    let cancelled = false;
    googleButtonRef.current.innerHTML = "";

    loadGoogleIdentityScript()
      .then((google) => {
        if (cancelled || !googleButtonRef.current) return;
        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async ({ credential }) => {
            if (!credential) {
              setError("Google nie zwrócił tokenu logowania.");
              return;
            }
            setError(null);
            setSubmitting(true);
            try {
              await googleLogin(credential);
              onSuccess();
            } catch (err) {
              setError(err.message);
            } finally {
              setSubmitting(false);
            }
          },
        });
        google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          width: "100%",
          text: mode === "login" ? "signin_with" : "signup_with",
        });
      })
      .catch(() => {
        if (!cancelled) {
          setError("Nie udało się załadować logowania Google.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [googleClientId, googleLogin, mode, onSuccess]);

  if (!mode) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={!!mode} onClose={onClose}>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--gradient-hero)" }}>
          <GraduationCap className="h-4 w-4 text-primary-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Witaj w Studybuddy</h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">Zaloguj się lub załóż konto, by przejść do swojego pulpitu.</p>
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
        <button type="button" onClick={() => onSwitch("login")} className={`rounded-lg py-2 text-sm font-medium ${mode === "login" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>Logowanie</button>
        <button type="button" onClick={() => onSwitch("register")} className={`rounded-lg py-2 text-sm font-medium ${mode === "register" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>Rejestracja</button>
      </div>
      <div className="mb-4 space-y-3">
        {googleClientId ? (
          <div ref={googleButtonRef} className="min-h-10" />
        ) : (
          <Button type="button" variant="outline" disabled className="w-full">
            Google login wymaga VITE_GOOGLE_CLIENT_ID
          </Button>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>albo</span>
          <div className="h-px flex-1 bg-border" />
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "register" && (
          <div className="space-y-1.5">
            <Label htmlFor="name">Imię</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jan" />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ty@uczelnia.pl" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pass">Hasło</Label>
          <Input id="pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full" style={{ background: "var(--gradient-hero)", color: "white" }}>
          {submitting ? "Pracuję…" : mode === "login" ? "Zaloguj się" : "Załóż konto"}
        </Button>
      </form>
    </Modal>
  );
}

export default function Home() {
  const [authMode, setAuthMode] = useState(null);
  const navigate = useNavigate();
  const handleAuthSuccess = () => { setAuthMode(null); navigate("/dashboard"); };
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--gradient-hero)" }}>
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Studybuddy</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Funkcje</a>
            <a href="#app" className="hover:text-foreground">Wypróbuj</a>
            <a href="#" className="hover:text-foreground">Cennik</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAuthMode("login")}>Zaloguj się</Button>
            <Button size="sm" onClick={() => setAuthMode("register")} style={{ background: "var(--gradient-hero)", color: "white" }}>Załóż konto</Button>
          </div>
        </div>
      </header>
      <main>
        <Hero onAuth={setAuthMode} />
        <section id="app" className="container mx-auto px-6 py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">Podgląd na żywo</Badge>
            <h2 className="text-4xl font-bold tracking-tight text-foreground">Czat po lewej. Plan po prawej.</h2>
            <p className="mt-3 text-muted-foreground">Buddy słucha, co masz na głowie, i zamienia to w konkretne wpisy w kalendarzu.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <ChatPanel onRequireAuth={() => setAuthMode("login")} />
            <CalendarPanel />
          </div>
        </section>
        <section id="features" className="border-y border-border bg-secondary/30 py-20">
          <div className="container mx-auto px-6">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="text-4xl font-bold tracking-tight text-foreground">Wszystko, czego potrzebuje zabiegany student</h2>
              <p className="mt-3 text-muted-foreground">Jeden asystent do Twojego planu, sesji nauki i spokoju ducha.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <Card key={f.title} className="p-6 transition-all hover:-translate-y-1" style={{ boxShadow: "var(--shadow-card)" }}>
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "var(--gradient-hero)" }}>
                    <f.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
        <section className="container mx-auto px-6 py-20">
          <div className="relative overflow-hidden rounded-3xl p-12 text-center" style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-glow)" }}>
            <h2 className="text-4xl font-bold text-primary-foreground">Przestań planować. Zacznij się uczyć.</h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">Dołącz do tysięcy studentów, którzy oddali planowanie Buddy'emu.</p>
            <Button size="lg" onClick={() => setAuthMode("register")} className="mt-8 bg-background text-foreground hover:opacity-90">
              Zaczynam — to darmowe
            </Button>
          </div>
        </section>
      </main>
      <footer className="border-t border-border py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-6 text-sm text-muted-foreground sm:flex-row">
          <p>© 2026 Studybuddy. Zrobione przez studentów, dla studentów.</p>
          <p>Zrobione z ☕ i AI</p>
        </div>
      </footer>
      <AuthDialog mode={authMode} onClose={() => setAuthMode(null)} onSwitch={setAuthMode} onSuccess={handleAuthSuccess} />
    </div>
  );
}
