# Frontend Swap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zastąpić obecny `frontend/` (React 18 + CRA + npm + Tailwind 3) zawartością repo `https://github.com/FilipFurdyna/plan-pal-ai-27` (React 19 + Vite 7 + Bun + Tailwind 4) i podpiąć komponenty UI (`AuthDialog`, `ChatPanel`, `CalendarPanel`) do istniejącego backendu FastAPI bez zmian w kontraktach API.

**Architecture:** Service layer (3 pliki: auth/chat/calendar — każdy z własnym inline `fetch`, bez wspólnego klienta) + `AuthContext` (token w localStorage) + `ProtectedRoute` dla `/dashboard`. Dev proxy w Vite `/api → http://localhost:8000`, prod relatywne URL-e (same-domain).

**Tech Stack:** React 19, Vite 7, Tailwind 4, React Router 7, Lucide Icons, Bun. Backend (bez zmian): FastAPI z routerami `/api/auth`, `/api/chat`, `/api/calendar`.

**Spec:** [docs/superpowers/specs/2026-05-12-frontend-swap-design.md](../specs/2026-05-12-frontend-swap-design.md)

---

## Notes for the executor

- Pracujesz na branchu `frontend-swap` (już istnieje).
- Backend zostaje uruchomiony lokalnie podczas testów (`cd backend && uvicorn app.main:app --reload`).
- Frontend uruchamiasz z `frontend/` przez `bun run dev` → port `:5173` po Task 5.
- Wszystkie ścieżki w planie są względem repo root: `D:\.Projekty\student-assistant\`.
- Commity są małe i częste — po każdym Task po zaakceptowaniu zmiany.
- Brak testów automatycznych — to migracja UI, weryfikacja end-to-end ręcznie w Task 16.

---

### Task 1: Tag aktualnego stanu jako punkt odniesienia

**Files:**
- Brak — tylko git tag

- [ ] **Step 1: Sprawdź czystość drzewa**

Run: `git status`
Expected: tylko untracked `.claude/` (nic związanego z frontendem niezacommitowane); aktualny branch `frontend-swap`.

- [ ] **Step 2: Stwórz tag pointujący na stan sprzed wymiany**

Run: `git tag pre-frontend-swap`
Expected: brak outputu (tag stworzony lokalnie).

- [ ] **Step 3: Sprawdź że tag istnieje**

Run: `git tag -l "pre-frontend-swap"`
Expected: `pre-frontend-swap`

---

### Task 2: Usuń stare pliki frontendu

**Files:**
- Delete (tracked): `frontend/src/`, `frontend/public/`, `frontend/package.json`, `frontend/package-lock.json`, `frontend/postcss.config.js`, `frontend/tailwind.config.js`
- Delete (untracked): `frontend/node_modules/`

- [ ] **Step 1: Usuń tracked pliki przez `git rm`**

Run:
```bash
git rm -r frontend/src frontend/public frontend/package.json frontend/package-lock.json frontend/postcss.config.js frontend/tailwind.config.js
```
Expected: lista plików oznaczona jako `rm`.

- [ ] **Step 2: Usuń node_modules (untracked)**

Run (PowerShell): `Remove-Item -Recurse -Force frontend/node_modules`
Lub Bash: `rm -rf frontend/node_modules`
Expected: brak błędów.

- [ ] **Step 3: Sprawdź że `frontend/` jest pusty**

Run: `ls frontend`
Expected: brak listingu (folder pusty) lub error "no such file".

- [ ] **Step 4: Commit wyczyszczenia**

```bash
git commit -m "Remove: old CRA-based frontend (preparing for Vite swap)"
```
Expected: jeden commit, kilkadziesiąt usuniętych plików.

---

### Task 3: Skopiuj zawartość nowego repo do `frontend/`

**Files:**
- Wszystkie z `https://github.com/FilipFurdyna/plan-pal-ai-27` poza `.git/` i `node_modules/`

- [ ] **Step 1: Sklonuj nowe repo do folderu tymczasowego**

Run:
```bash
git clone --depth 1 https://github.com/FilipFurdyna/plan-pal-ai-27.git .tmp-new-frontend
```
Expected: "Cloning into '.tmp-new-frontend'... done."

- [ ] **Step 2: Stwórz pusty folder `frontend/` jeśli zniknął**

Run: `mkdir -p frontend`
Expected: brak błędów (folder istnieje lub został utworzony).

- [ ] **Step 3: Skopiuj zawartość (bez `.git`)**

Run (Bash):
```bash
cp -r .tmp-new-frontend/. frontend/
rm -rf frontend/.git
```
Lub PowerShell:
```powershell
Copy-Item -Recurse .tmp-new-frontend\* frontend\
Copy-Item -Recurse .tmp-new-frontend\.gitignore frontend\ -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force frontend\.git -ErrorAction SilentlyContinue
```
Expected: pliki w `frontend/` (sprawdź `ls frontend`: powinno być `index.html`, `package.json`, `vite.config.js`, `src/`, itd.).

- [ ] **Step 4: Usuń tymczasowy folder**

Run: `rm -rf .tmp-new-frontend` (Bash) lub `Remove-Item -Recurse -Force .tmp-new-frontend` (PowerShell)
Expected: folder zniknął.

- [ ] **Step 5: Sprawdź strukturę**

Run: `ls frontend && ls frontend/src`
Expected: w `frontend/`: `bun.lock`, `components.json`, `index.html`, `package.json`, `public/`, `src/`, `vite.config.js`, itp.
W `frontend/src/`: `assets/`, `components/`, `lib/`, `pages/`, `main.jsx`, `styles.css`.

- [ ] **Step 6: Dodaj wszystko do gita i commituj**

```bash
git add frontend/
git commit -m "Add: copy plan-pal-ai-27 source into frontend/ (raw, pre-integration)"
```
Expected: kilkadziesiąt nowych plików.

---

### Task 4: Zainstaluj zależności i zweryfikuj baseline

**Files:** brak modyfikacji

- [ ] **Step 1: Zainstaluj zależności Bun**

Run:
```bash
cd frontend && bun install
```
Expected: instalacja zakończona, `node_modules/` powstałe. Jeśli błąd "bun: command not found" — patrz https://bun.sh/docs/installation.

- [ ] **Step 2: Uruchom dev server (test smokowy)**

Run: `bun run dev`
Expected: Vite startuje, log z URL-em (np. `http://localhost:8080/` — port jeszcze przed zmianą).

- [ ] **Step 3: Otwórz URL w przeglądarce**

Otwórz pokazany URL.
Expected: ładuje się landing page "Studybuddy" z Hero, modal "Zaloguj się/Załóż konto" działa wizualnie, chat/calendar pokazuje mocki. Pamiętaj — to jeszcze tylko UI, bez integracji.

- [ ] **Step 4: Zatrzymaj dev server**

Ctrl+C w terminalu z `bun run dev`.

- [ ] **Step 5: Sanity check buildu produkcyjnego (nieobowiązkowy ale szybki)**

Run: `bun run build`
Expected: build kończy się sukcesem (`dist/` powstaje). Po sprawdzeniu usuń folder: `rm -rf dist`.

- [ ] **Step 6: Wróć do repo root**

Run: `cd ..`

Brak commita (Task 4 nie modyfikuje plików).

---

### Task 5: Skonfiguruj `vite.config.js` — proxy, alias, domyślny port

**Files:**
- Modify: `frontend/vite.config.js`

- [ ] **Step 1: Zastąp zawartość `frontend/vite.config.js`**

Stara zawartość (z repo `plan-pal-ai-27`):

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: { host: "::", port: 8080, strictPort: true },
});
```

Zastąp całą zawartość pliku:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    proxy: {
      "/api": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
});
```

Zmiany:
- Usunięty `host: "::"`, `port: 8080`, `strictPort: true` (Vite użyje domyślnego `:5173`)
- Dodany `server.proxy` dla `/api` → backend FastAPI na `:8000`
- Alias `@` → `./src` (zostaje, był już w oryginale)

- [ ] **Step 2: Weryfikacja — uruchom dev i sprawdź port**

Run:
```bash
cd frontend && bun run dev
```
Expected: log z `http://localhost:5173/`.

- [ ] **Step 3: Otwórz `:5173`, sprawdź że strona wciąż działa**

Otwórz `http://localhost:5173/` w przeglądarce.
Expected: identyczne UI jak w Task 4.

- [ ] **Step 4: Zatrzymaj dev server, wróć do repo root**

Ctrl+C, `cd ..`.

- [ ] **Step 5: Commit**

```bash
git add frontend/vite.config.js
git commit -m "Add: Vite dev proxy /api -> localhost:8000, default port 5173"
```

---

### Task 6: Utwórz `frontend/src/services/authService.js`

**Files:**
- Create: `frontend/src/services/authService.js`

- [ ] **Step 1: Stwórz katalog `services`**

Run: `mkdir -p frontend/src/services`

- [ ] **Step 2: Stwórz plik `frontend/src/services/authService.js`**

Zawartość:

```js
export async function register(email, password) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Rejestracja nie powiodła się");
  }
  return response.json();
}

export async function login(email, password) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Logowanie nie powiodło się");
  }
  return response.json(); // { access_token, token_type }
}

export async function getMe(token) {
  const response = await fetch("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Nie udało się pobrać profilu");
  }
  return response.json(); // { id, email }
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/authService.js
git commit -m "Add: authService (register, login, getMe)"
```

---

### Task 7: Utwórz `frontend/src/services/chatService.js`

**Files:**
- Create: `frontend/src/services/chatService.js`

- [ ] **Step 1: Stwórz plik `frontend/src/services/chatService.js`**

Zawartość:

```js
const SESSION_KEY = "chat_session_id";

export function getOrCreateSessionId() {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function resetSessionId() {
  sessionStorage.removeItem(SESSION_KEY);
}

export async function sendMessage(sessionId, message, imageFile) {
  const formData = new FormData();
  formData.append("session_id", sessionId);
  formData.append("message", message);
  if (imageFile) {
    formData.append("image", imageFile);
  }

  const response = await fetch("/api/chat/", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Czat nie odpowiada");
  }
  return response.json(); // { response: string }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/services/chatService.js
git commit -m "Add: chatService (sendMessage, sessionId helpers)"
```

---

### Task 8: Utwórz `frontend/src/services/calendarService.js`

**Files:**
- Create: `frontend/src/services/calendarService.js`

- [ ] **Step 1: Stwórz plik `frontend/src/services/calendarService.js`**

Zawartość:

```js
function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function getEvents(token) {
  const response = await fetch("/api/calendar/events", {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Nie udało się pobrać wydarzeń");
  }
  return response.json(); // CalendarEventRead[]
}

export async function createEvent(token, data) {
  const response = await fetch("/api/calendar/events", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Nie udało się dodać wydarzenia");
  }
  return response.json();
}

export async function updateEvent(token, id, data) {
  const response = await fetch(`/api/calendar/events/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Nie udało się zaktualizować wydarzenia");
  }
  return response.json();
}

export async function deleteEvent(token, id) {
  const response = await fetch(`/api/calendar/events/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Nie udało się usunąć wydarzenia");
  }
  return response.json();
}
```

Uwaga: backend wymaga pól `{ title, start_time, end_time }` jako ISO datetime + opcjonalne `description`, `event_type`, `priority`, `status`, `created_by`. To wiedza dla wołających (Home/Dashboard), nie dla serwisu.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/services/calendarService.js
git commit -m "Add: calendarService (CRUD events)"
```

---

### Task 9: Utwórz `frontend/src/context/AuthContext.jsx`

**Files:**
- Create: `frontend/src/context/AuthContext.jsx`

- [ ] **Step 1: Stwórz katalog `context`**

Run: `mkdir -p frontend/src/context`

- [ ] **Step 2: Stwórz plik `frontend/src/context/AuthContext.jsx`**

Zawartość:

```jsx
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as authService from "@/services/authService.js";
import { resetSessionId } from "@/services/chatService.js";

const TOKEN_KEY = "auth_token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  // Bootstrap once on mount: validate any stored token via /me.
  // Empty deps are intentional — login/register/logout manage state directly,
  // so we must NOT re-run on token changes (would cause duplicate getMe calls).
  useEffect(() => {
    let cancelled = false;
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setLoading(false);
      return;
    }
    authService.getMe(storedToken)
      .then((me) => { if (!cancelled) setUser(me); })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email, password) => {
    const { access_token } = await authService.login(email, password);
    localStorage.setItem(TOKEN_KEY, access_token);
    setToken(access_token);
    const me = await authService.getMe(access_token);
    setUser(me);
  }, []);

  const register = useCallback(async (email, password) => {
    await authService.register(email, password);
    const { access_token } = await authService.login(email, password);
    localStorage.setItem(TOKEN_KEY, access_token);
    setToken(access_token);
    const me = await authService.getMe(access_token);
    setUser(me);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    resetSessionId();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

Zachowanie:
- Token z localStorage przy mount → walidacja przez `getMe`. Błąd → czyścimy.
- `login(email, password)` — pełen flow: login → zapis tokenu → getMe → set user.
- `register(email, password)` — register, potem login (auto-login po rejestracji).
- `logout()` — czyści token, user, oraz `session_id` czatu (nowa sesja po następnym zalogowaniu).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/context/AuthContext.jsx
git commit -m "Add: AuthContext (token bootstrap, login/register/logout)"
```

---

### Task 10: Utwórz `frontend/src/components/ProtectedRoute.jsx`

**Files:**
- Create: `frontend/src/components/ProtectedRoute.jsx`

- [ ] **Step 1: Stwórz plik `frontend/src/components/ProtectedRoute.jsx`**

Zawartość:

```jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Ładowanie…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ProtectedRoute.jsx
git commit -m "Add: ProtectedRoute component for /dashboard gating"
```

---

### Task 11: Wstaw `AuthProvider` i `ProtectedRoute` w `main.jsx`

**Files:**
- Modify: `frontend/src/main.jsx`

- [ ] **Step 1: Zastąp zawartość `frontend/src/main.jsx`**

Stara zawartość (z plan-pal-ai-27):

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
```

Zastąp pełną zawartość:

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext.jsx";
import ProtectedRoute from "@/components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
```

- [ ] **Step 2: Sanity test — uruchom dev, sprawdź że strona ładuje**

Run:
```bash
cd frontend && bun run dev
```
Otwórz `http://localhost:5173/`.
Expected: Home ładuje się normalnie. Wpisz w pasku adresu `http://localhost:5173/dashboard` → powinno zredirectować na `/` (bo nie ma usera; `ProtectedRoute` → `Navigate to /`).

Po sprawdzeniu Ctrl+C, `cd ..`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/main.jsx
git commit -m "Add: wrap routes with AuthProvider + protect /dashboard"
```

---

### Task 12: Podepnij `Home.jsx` do API (AuthDialog + ChatPanel gate + CalendarPanel)

**Files:**
- Modify: `frontend/src/pages/Home.jsx`

To największa zmiana w pojedynczym pliku. Zachowujemy JSX styling — modyfikujemy logikę i kilka inputów.

- [ ] **Step 1: Dodaj importy `useAuth`, serwisy chatu i kalendarza**

Na górze pliku, po `import heroImg from ...`, dodaj:

```jsx
import { useAuth } from "@/context/AuthContext.jsx";
import * as calendarService from "@/services/calendarService.js";
```

- [ ] **Step 2: Zmodyfikuj `Hero` — dziedziczy bez zmian**

`Hero({ onAuth })` zostaje bez zmian.

- [ ] **Step 3: Zmodyfikuj `ChatPanel` — gate przez AuthDialog**

Zmień sygnaturę i logikę `ChatPanel` (jest funkcją wewnątrz Home.jsx). Po zmianie wygląda tak:

```jsx
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
```

Zmiany:
- `ChatPanel` przyjmuje prop `onRequireAuth`.
- `send` zamiast `setTimeout` woła `onRequireAuth()` (otwiera modal auth).
- Placeholder inputu zmieniony na "Zaloguj się, by porozmawiać z Buddym…".
- `setMessages([STARTER_MESSAGES])` zostaje — pokazujemy przykładową wymianę dla efektu, ale realnej wysyłki nie ma.

- [ ] **Step 4: Stwórz helper formatu czasu eventów (inline, na górze pliku)**

Pod `STARTER_MESSAGES`/`STARTER_EVENTS`/`FEATURES` dodaj:

```jsx
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
```

- [ ] **Step 5: Zmodyfikuj `CalendarPanel` — wczytuje i tworzy eventy przez API**

Zastąp całe `CalendarPanel`:

```jsx
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
```

Zmiany:
- Dodano `useAuth()`, `useState`, `useEffect` (już są w imporcie z React)
- Initial `events` = `[]`, ładuje przez API gdy `token`
- Input `time` → `<Input type="datetime-local">` (ISO format wyjścia)
- `add()` wywołuje `calendarService.createEvent` z `start_time` + `end_time` (start + 1h)
- Inputy disabled gdy `!token`
- Display: `e.start_time` formatowany przez `formatEventTime`, `e.event_type` jako tag
- Komunikaty stanów: loading, error, empty

- [ ] **Step 6: Podaj `onRequireAuth` do `ChatPanel` w renderze `Home`**

W komponencie `Home`, sekcja `id="app"`:

Stare:
```jsx
<div className="grid gap-6 lg:grid-cols-2">
  <ChatPanel />
  <CalendarPanel />
</div>
```

Nowe:
```jsx
<div className="grid gap-6 lg:grid-cols-2">
  <ChatPanel onRequireAuth={() => setAuthMode("login")} />
  <CalendarPanel />
</div>
```

- [ ] **Step 7: Zaktualizuj `AuthDialog` — kontrolowane inputy + integracja**

Zastąp całe `AuthDialog`:

```jsx
function AuthDialog({ mode, onClose, onSwitch, onSuccess }) {
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setEmail("");
    setPassword("");
    setName("");
    setError(null);
    setSubmitting(false);
  }, [mode]);

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
```

Zmiany:
- `useAuth()` daje `login`, `register`
- Stan: `email`, `password`, `name`, `submitting`, `error`
- Reset stanu przy zmianie `mode` (przełączenie login ↔ register)
- `handleSubmit` woła odpowiednio `login`/`register`, łapie błąd, pokazuje
- `name` jest cosmetic — backend nie używa (zostaje w UI bo nowy front go ma)
- Buttony zakładek zmienione na `type="button"` żeby nie submitowały formularza

- [ ] **Step 8: Weryfikacja — uruchom backend i frontend**

Terminal 1 (z roota repo):
```bash
cd backend && uvicorn app.main:app --reload
```

Terminal 2 (równolegle, z roota repo):
```bash
cd frontend && bun run dev
```

Otwórz `http://localhost:5173/`.
Expected:
- Strona Home ładuje się
- Kalendarz pokazuje "Zaloguj się, by zobaczyć kalendarz", inputy disabled
- Kliknięcie "Wyślij" w ChatPanel (po wpisaniu czegoś) → otwiera AuthDialog
- Rejestracja: wpisz email (unikalny) + hasło, klikni "Załóż konto" → modal się zamyka, redirect na `/dashboard` (które jeszcze ma mocki, to OK na razie)
- Refresh `/dashboard` → zostajesz (token w localStorage)
- Sprawdź konsolę: brak błędów CORS, brak 401

Po sprawdzeniu Ctrl+C w obu terminalach. `cd ..` w terminalu frontu (jeśli nie zatrzymujesz).

- [ ] **Step 9: Commit**

```bash
git add frontend/src/pages/Home.jsx
git commit -m "Add: wire Home.jsx to API (AuthDialog, calendar; chat gates auth)"
```

---

### Task 13: Podepnij `Dashboard.jsx` do API (chat, calendar, logout)

**Files:**
- Modify: `frontend/src/pages/Dashboard.jsx`

Dashboard inlinuje chat + calendar w JSX (nie używa wewnętrznych komponentów jak Home). Zmieniamy logikę in-place.

- [ ] **Step 1: Zastąp pełną zawartość `frontend/src/pages/Dashboard.jsx`**

```jsx
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles, CalendarDays, Send, Plus, Bell, Clock, GraduationCap, LogOut, Home as HomeIcon,
} from "lucide-react";
import { Button, Card, Input, Badge } from "@/components/ui.jsx";
import { useAuth } from "@/context/AuthContext.jsx";
import * as chatService from "@/services/chatService.js";
import * as calendarService from "@/services/calendarService.js";

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

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState(null);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");

  const scrollRef = useRef(null);

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
    if (!input.trim() || sending) return;
    const userText = input.trim();
    setMessages((m) => [...m, { role: "user", text: userText }]);
    setInput("");
    setSending(true);
    setChatError(null);
    try {
      const sessionId = chatService.getOrCreateSessionId();
      const { response } = await chatService.sendMessage(sessionId, userText);
      setMessages((m) => [...m, { role: "ai", text: response }]);
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
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-secondary-foreground rounded-bl-sm"}`}>{m.text}</div>
                </div>
              ))}
              {sending && <p className="text-xs text-muted-foreground">Buddy pisze…</p>}
              {chatError && <p className="text-xs text-red-600">{chatError}</p>}
            </div>
            <div className="flex gap-2 border-t border-border p-3">
              <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Napisz do Buddy'ego…" disabled={sending} />
              <Button onClick={send} disabled={sending} size="icon" style={{ background: "var(--gradient-hero)", color: "white" }}><Send className="h-4 w-4" /></Button>
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
```

Zmiany:
- `useAuth()` → `user`, `token`, `logout`
- `useNavigate()` → po wylogowaniu redirect na `/`
- `send()` woła `chatService.sendMessage` (z session_id), pokazuje "Buddy pisze…" i błędy
- `addEvent()` woła `calendarService.createEvent` z `start_time` + `end_time = start + 1h`
- `useEffect` ładuje eventy gdy `token` jest
- Wyloguj — `handleLogout` woła `logout()` + `navigate("/")`
- Greeting używa `user.email` (zamiast hardcoded "Janek")
- `<Input type="datetime-local">` zamiast tekstowego
- Statyczne "5" i "Pt" w kartach statystyk → "—" (nie hardcodujemy fałszywych danych)

- [ ] **Step 2: Weryfikacja**

Backend nadal działa. Frontend dev server uruchomiony (`bun run dev`).

Otwórz `http://localhost:5173/`, zaloguj się przez AuthDialog na koncie z Task 12.
Expected:
- Redirect na `/dashboard`
- Greeting pokazuje email
- Kalendarz: pusty (lub eventy z `user_id=1` jeśli istnieją) — bez błędów konsoli
- Wpisz coś w chat, Enter / Send → po chwili odpowiedź z Gemini
- Dodaj event: wpisz tytuł, wybierz datę/czas → event pojawia się w liście
- Klik "Wyloguj" → redirect na `/`, refresh → zostajesz na `/`
- Ponowny próba wejścia na `/dashboard` bez logowania → redirect na `/`

Po sprawdzeniu Ctrl+C dev server, ale **zostaw backend uruchomiony** dla Task 14.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Dashboard.jsx
git commit -m "Add: wire Dashboard.jsx to API (chat, calendar, logout)"
```

---

### Task 14: Zaktualizuj CORS w backendzie

**Files:**
- Modify: `backend/app/main.py`

- [ ] **Step 1: Edytuj `backend/app/main.py`**

Stara lista `allow_origins`:
```python
allow_origins=["http://localhost:3000", "http://neeklines.xyz"],
```

Nowa:
```python
allow_origins=["http://localhost:5173", "https://neeklines.xyz"],
```

Pełen blok middleware po zmianie:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://neeklines.xyz"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Powody zmian:
- `http://localhost:3000` → niepotrzebny, stary CRA znika
- `http://neeklines.xyz` → niepotrzebny, prod hosting odrzuca HTTP
- `http://localhost:5173` → bezpiecznik (w normalnym dev-flow Vite proxy zapewnia same-origin)
- `https://neeklines.xyz` → dla bezpośrednich requestów na prod API

- [ ] **Step 2: Sprawdź że backend wciąż startuje**

Backend był uruchomiony — sprawdź log w jego terminalu. `--reload` powinien był wykryć zmianę. Jeśli nie:
```bash
cd backend && uvicorn app.main:app --reload
```
Expected: brak błędów importu, server listuje endpointy.

- [ ] **Step 3: Commit**

```bash
git add backend/app/main.py
git commit -m "Update: CORS allow_origins for Vite dev (5173) and https prod"
```

---

### Task 15: Zaktualizuj `CONTRIBUTIONS.md` (frontend setup)

**Files:**
- Modify: `CONTRIBUTIONS.md` (linie ~355–367 i ~373)

- [ ] **Step 1: Zmień sekcję "Frontend (React)"**

Stary fragment:
```markdown
## ⚛️ Frontend (React)

```bash
cd client
npm install
npm start
```

Frontend will run at:

```
http://localhost:3000
```
```

Nowy:
```markdown
## ⚛️ Frontend (React + Vite + Bun)

```bash
cd frontend
bun install
bun run dev
```

Frontend will run at:

```
http://localhost:5173
```
```

- [ ] **Step 2: Popraw też `cd server` na `cd backend` w sekcji backendu (oczywista pomyłka)**

Stary fragment:
```markdown
## 🔗 Backend (FastAPI)

```bash
cd server
python -m venv venv
```
```

Nowy:
```markdown
## 🔗 Backend (FastAPI)

```bash
cd backend
python -m venv venv
```
```

- [ ] **Step 3: Commit**

```bash
git add CONTRIBUTIONS.md
git commit -m "Fix: update frontend setup (Bun, port 5173) and backend dir name in contributing guide"
```

---

### Task 16: Manual E2E weryfikacja pełnej ścieżki

**Files:** brak zmian — to checklista weryfikacyjna.

Uruchom backend i frontend, otwórz `http://localhost:5173/`. Wykonaj każdy punkt:

- [ ] **Krok 1: Rejestracja**

Klik "Załóż konto" w nagłówku → modal otwarty na "Rejestracja". Wpisz unikalny email (`test+<timestamp>@example.com`) i hasło (≥4 znaki). Klik "Załóż konto".
Expected: modal się zamyka, URL zmienia się na `/dashboard`, header pokazuje "Cześć, <email> 👋".

- [ ] **Krok 2: Czat z Buddym (Gemini)**

W panelu czatu wpisz "Co mam zaplanować na jutro?" → Enter.
Expected: po chwili odpowiedź AI dodawana do listy. Brak błędu w konsoli, brak 401/500 w Network tabie.

- [ ] **Krok 3: Dodanie wydarzenia**

W panelu kalendarza: tytuł "Test event", wybierz datetime jutro 10:00 → klik "+".
Expected: event pojawia się na liście z formatem "śr, 10:00" (lub odpowiedni dzień), tag "Custom".

- [ ] **Krok 4: Refresh strony**

F5 na `/dashboard`.
Expected: zostajesz na `/dashboard`, user nadal widoczny, event nadal na liście (z backendu).

- [ ] **Krok 5: Logout**

Klik "Wyloguj".
Expected: redirect na `/`. W DevTools → Application → Local Storage → brak `auth_token`.

- [ ] **Krok 6: Próba wejścia na dashboard bez logowania**

W pasku adresu: `http://localhost:5173/dashboard`.
Expected: redirect na `/`.

- [ ] **Krok 7: Logowanie istniejącym kontem**

Klik "Zaloguj się" → wpisz email i hasło z Kroku 1 → "Zaloguj się".
Expected: redirect na `/dashboard`, event z Kroku 3 wciąż widoczny.

- [ ] **Krok 8: Chat na Home (gate)**

Wyloguj się. Na Home wpisz coś w chat panel i klik Send.
Expected: AuthDialog otwiera się, brak wywołania API (sprawdź Network tab).

- [ ] **Krok 9: Błędy logowania**

Wyloguj się. Otwórz AuthDialog → Logowanie. Wpisz email z Kroku 1 z błędnym hasłem.
Expected: pod formularzem czerwony komunikat "Invalid credentials" (lub podobny z FastAPI).

- [ ] **Krok 10: Test buildu produkcyjnego**

W frontend:
```bash
bun run build
```
Expected: build kończy się sukcesem. Po sprawdzeniu: `rm -rf dist` (nie commitujemy).

Jeśli wszystkie kroki przeszły — sukces. Jeśli któryś nie przeszedł, zatrzymaj się, zdiagnozuj, popraw zanim przejdziesz do Task 17.

---

### Task 17: Finalna walidacja git i podsumowanie

**Files:** brak zmian.

- [ ] **Step 1: Sprawdź historię commitów na branchu**

Run: `git log --oneline pre-frontend-swap..HEAD`
Expected: lista wszystkich commitów Task 1–15 w kolejności.

- [ ] **Step 2: Sprawdź czystość drzewa**

Run: `git status`
Expected: czyste drzewo (tylko `.claude/` jako untracked, jeśli było wcześniej).

- [ ] **Step 3: Sprawdź różnicę między tagiem a HEAD na shoulds**

Run: `git diff --stat pre-frontend-swap..HEAD`
Expected: zmiany w `frontend/*` (większość plików nowych), `backend/app/main.py` (CORS), `CONTRIBUTIONS.md` (instrukcje), `docs/superpowers/...` (spec + plan).

- [ ] **Step 4: Komunikat finalny**

Frontend swap kompletny. Branch `frontend-swap` ma:
- Nowy frontend Vite + Bun w `frontend/`
- Zintegrowany z istniejącym backendem przez `services/` + `AuthContext`
- Backend CORS zaktualizowany
- `CONTRIBUTIONS.md` poprawne
- `pre-frontend-swap` tag dla rollbacku

Następny krok (poza zakresem planu): PR `frontend-swap` → `master` po code review. Jest to action wymagająca explicit user request.

---

## Known limitations (per spec)

- Backend `calendar` ma hardcoded `user_id = 1` — wszyscy zalogowani widzą te same wydarzenia. Naprawa = osobny task.
- Brak Google OAuth w UI (backend wciąż wspiera) — osobny task, wymaga `@react-oauth/google` + `VITE_GOOGLE_CLIENT_ID`.
- Backend `/api/chat/` nie wymaga tokenu — bypass front-gate jest możliwy przez bezpośredni request.
- `README.md` wciąż brandowany jako "SmartSub" — rebranding osobny task.
