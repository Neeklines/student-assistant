# Frontend swap: CRA → Vite (StudyBuddy)

**Date:** 2026-05-12
**Branch:** `frontend-swap`
**Status:** Design — awaiting user review

## Cel

Wymienić obecny frontend (React 18 + CRA + Tailwind 3 + npm) na nowy frontend z repozytorium `https://github.com/FilipFurdyna/plan-pal-ai-27` (React 19 + Vite 7 + Tailwind 4 + Bun) i podpiąć jego komponenty do istniejącego backendu FastAPI bez zmian w kontraktach API.

Zakres (opcja A — minimalna podmiana): kopiujemy nowy front, zastępujemy mocki (`setTimeout`, lokalny stan) realnymi wywołaniami `/api/*`. Nie dorabiamy nowych ekranów. Backend zostaje bez zmian poza listą CORS origins.

## Kontekst

- **Backend (zostaje, FastAPI):** routery pod `/api`:
  - `auth` — `POST /register`, `POST /login`, `GET /me`, `POST /google-login`
  - `chat` — `POST /` (multipart: `session_id`, `message`, opcjonalny `image`)
  - `calendar` — `GET/POST/PUT/DELETE /events[/{id}]`
  - `meta`, `health`
- **Nowy frontend (plan-pal-ai-27 / StudyBuddy):**
  - React 19, Vite 7, Tailwind 4, React Router 7, Lucide, Bun jako package manager
  - Strony: `/` (Home: Hero, ChatPanel, CalendarPanel, AuthDialog jako modal), `/dashboard` (Header, Greeting, Stats, ChatPanel, CalendarPanel)
  - Komponenty UI w `src/components/ui.jsx` (Button, Card, Input, Badge, Label, Modal)
  - Zero integracji z API — wszystko mockowane przez `setTimeout` i lokalny stan
  - Brak Google OAuth, brak kontekstu auth

## Architektura

```
[New React+Vite frontend] --(fetch /api/*)--> [FastAPI backend (bez zmian)] --> [SQLite/MySQL]
        |
   services/ (auth, chat, calendar)     ← każdy z własnym inline fetch
   context/AuthContext                  ← stan zalogowania, token w localStorage
```

Wzorzec **service layer + AuthContext** — kopia podejścia ze starego frontu (gdzie już działało), tylko adaptowana do Vite (`import.meta.env`) i nowych komponentów.

## Układ katalogów po wymianie

```
frontend/
├── public/
├── src/
│   ├── assets/                  # z nowego repo
│   ├── components/
│   │   ├── ui.jsx               # z nowego repo
│   │   └── ProtectedRoute.jsx   # NOWY
│   ├── pages/
│   │   ├── Home.jsx             # z nowego repo + podpięcie do API
│   │   └── Dashboard.jsx        # z nowego repo + podpięcie do API + ProtectedRoute
│   ├── context/
│   │   └── AuthContext.jsx      # NOWY
│   ├── services/
│   │   ├── authService.js       # NOWY
│   │   ├── chatService.js       # NOWY
│   │   └── calendarService.js   # NOWY
│   ├── lib/utils.js             # z nowego repo
│   ├── main.jsx                 # z nowego repo + AuthProvider
│   └── styles.css               # z nowego repo
├── index.html                   # z nowego repo
├── vite.config.js               # z nowego repo (z aliasem @ → ./src)
├── tailwind.config.*            # z nowego repo
├── package.json                 # z nowego repo
└── bun.lock                     # z nowego repo
```

Wszystko inne w obecnym `frontend/` (stary `src/`, `package-lock.json`, `postcss.config.js`, `node_modules/`) — usuwamy.

## Service layer

Każdy serwis to plik z funkcjami exportującymi konkretne wywołania `fetch`. Bez wspólnego klienta — `fetch` jest wystarczająco prostym API dla 4 serwisów i ~8 funkcji, abstrakcja byłaby przerostem formy. Wzorzec inspirowany starym `subscriptionService.js`: bezpośredni `fetch` z manualnie dodanym tokenem.

**Wspólne zasady (powtarzane w każdym serwisie):**
- Ścieżki **relatywne** (`/api/...`) — żadnego base URL, żadnego `.env`. W dev: Vite proxy. W prod: same-domain.
- Funkcje wymagające auth biorą `token` jako argument (zamiast czytać `localStorage` w środku) — łatwiej testować, AuthContext przekazuje token z góry. Funkcje bez auth — bez parametru `token`.
- Header `Authorization: Bearer ${token}` dodawany ręcznie tam gdzie potrzebny.
- Body JSON → `Content-Type: application/json` + `JSON.stringify(body)`. FormData → bez Content-Type (przeglądarka sama ustawi boundary).
- Po `fetch`: `if (!response.ok) throw new Error(...)` z parsowaniem `detail` z FastAPI. Sukces: `return response.json()`.

### `src/services/authService.js`
- `register(email, password)` → `POST /api/auth/register` JSON
- `login(email, password)` → `POST /api/auth/login` JSON → `{ access_token, token_type }`
- `getMe(token)` → `GET /api/auth/me` z Bearer → `{ id, email }`

### `src/services/chatService.js`
- `sendMessage(sessionId, message, imageFile?)` → `POST /api/chat/` jako `FormData` (`session_id`, `message`, `image?`)
- `sessionId` generowany na froncie (`crypto.randomUUID()`), trzymany w `sessionStorage` (przeżywa F5, ginie po zamknięciu karty)
- Bez tokenu — backend nie wymaga

### `src/services/calendarService.js`
- `getEvents(token)` → `GET /api/calendar/events`
- `createEvent(token, data)` → `POST /api/calendar/events` JSON
- `updateEvent(token, id, data)` → `PUT /api/calendar/events/{id}` JSON
- `deleteEvent(token, id)` → `DELETE /api/calendar/events/{id}`

Pola wydarzenia (`title`, `start_time`, `end_time`, ewentualne kategorie) — weryfikacja w `backend/app/schemas/calendar_event.py` na etapie implementacji. Format dat: ISO 8601 string (`new Date().toISOString()`).

## AuthContext

`src/context/AuthContext.jsx`:
- Stan: `{ user, token, loading }`
- `login(email, password)`: woła `authService.login`, zapisuje token do `localStorage`, woła `getMe()`, ustawia `user`
- `register(email, password)`: woła `authService.register`, potem `login` (auto-login po rejestracji)
- `logout()`: czyści `localStorage` i stan
- Przy mount: jeśli token jest w `localStorage` → `getMe()` żeby zwalidować i pobrać usera; w razie 401 czyścimy token
- Eksportuje hook `useAuth()`

## Routing

`src/main.jsx`:

```jsx
<AuthProvider>
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    </Routes>
  </BrowserRouter>
</AuthProvider>
```

`src/components/ProtectedRoute.jsx`:
- Bierze `useAuth()`
- Jeśli `loading` → null (lub mały loader)
- Jeśli brak `user` → `<Navigate to="/" replace />`
- W przeciwnym razie renderuje children

## Modyfikacje komponentów nowego frontu

Wszystko minimalne — usuwamy mocki, podstawiamy serwisy.

**`AuthDialog` (w Home.jsx):**
- `handleSubmit` zamiast `setTimeout` woła `auth.login()` lub `auth.register()`
- Po sukcesie: `navigate('/dashboard')`
- Błąd (np. 401, "Invalid credentials") wyświetlamy inline pod formularzem

**`ChatPanel` na `Dashboard.jsx`:**
- `sendMessage` woła `chatService.sendMessage(sessionId, text)`
- Lista wiadomości lokalnie + odpowiedź dodawana po otrzymaniu z backendu
- Loading state przyciskiem "Send" (disable + spinner)
- `sessionId` z `sessionStorage` (`crypto.randomUUID()` przy pierwszym wejściu po login)

**`ChatPanel` na `Home.jsx` (auth wall):**
- UI zostaje (zachęta wizualna do funkcji), ale **brak prawdziwej wysyłki**
- Kliknięcie "Wyślij" gdy `!user` → otwiera `AuthDialog` zamiast wywoływać API
- Po udanym logowaniu/rejestracji → redirect na `/dashboard` (zgodnie z `AuthDialog.onSuccess`); ewentualna treść wpisana na Home nie jest przenoszona (akceptowalna utrata; user wpisuje ponownie na Dashboard)
- Brak mocków `setTimeout` — usuwamy całą logikę fake-Buddy z Home

**`CalendarPanel` (Home.jsx i Dashboard.jsx):**
- `useEffect` na mount → `calendarService.getEvents()`
- "Dodaj wydarzenie" → `createEvent()`, po sukcesie odświeżamy listę (refetch lub append do stanu)
- Edycja/usuwanie — analogicznie

**`Dashboard.jsx` — Header:**
- Przycisk "Logout" woła `auth.logout()` + `navigate('/')`

## Konfiguracja

### Frontend — Vite proxy + alias

W `frontend/vite.config.js` (zachowując to co już jest w nowym repo):

```js
server: {
  proxy: {
    '/api': { target: 'http://localhost:8000', changeOrigin: true }
  }
},
resolve: {
  alias: { '@': path.resolve(__dirname, './src') }
}
```

- **Proxy** — w dev mode wszystkie requesty z frontu na `/api/...` są forwardowane do `http://localhost:8000/api/...`. Tak samo jak działał stary `setupProxy.js` z CRA. Front używa relatywnych ścieżek (`fetch('/api/auth/login')`), więc to samo działa w prod (reverse proxy na `neeklines.xyz`).
- **Alias `@` → `./src`** — sprawdzamy `vite.config.js` z nowego repo; jeśli aliasu nie ma, dodajemy (`Home.jsx` używa `@/components/ui.jsx`).

**Bez `.env` w ogóle** — nie potrzebujemy `VITE_API_URL`, bo wszystko relatywne.

### Backend — CORS

W `backend/app/main.py` aktualizujemy listę `allow_origins`:

```python
allow_origins=[
    "http://localhost:5173",
    "https://neeklines.xyz",
]
```

- Usuwamy `http://localhost:3000` (stary front znika)
- Usuwamy `http://neeklines.xyz` — hosting i tak odrzuca/redirectuje czysty HTTP; wpis byłby tylko dezinformacją
- `http://localhost:5173` zostaje jako **bezpiecznik** — w normalnym flow dev Vite proxy zapewnia same-origin, ale gdyby ktoś użył pełnego URL-a (`fetch('http://localhost:8000/...')`), uderzył w API z DevTools/Postmana z otwartą stroną, albo źle skonfigurował proxy, CORS nadal pozwoli
- `https://neeklines.xyz` zostaje dla bezpośrednich requestów na endpoint prod

## Mapowanie UI → endpointy

| Komponent / akcja | Metoda | Endpoint | Auth | Body |
|---|---|---|---|---|
| AuthDialog → Login | POST | `/api/auth/login` | nie | `{email, password}` JSON |
| AuthDialog → Register | POST | `/api/auth/register` | nie | `{email, password}` JSON |
| AuthProvider init | GET | `/api/auth/me` | tak | — |
| ChatPanel (Dashboard) → send | POST | `/api/chat/` | nie* | FormData: `session_id`, `message`, `image?` |
| ChatPanel (Home) → send | — | (otwiera AuthDialog) | — | brak wywołania API |
| CalendarPanel → load | GET | `/api/calendar/events` | tak** | — |
| CalendarPanel → add | POST | `/api/calendar/events` | tak** | `{title, start_time, end_time, ...}` JSON |
| CalendarPanel → edit | PUT | `/api/calendar/events/{id}` | tak** | jak wyżej |
| CalendarPanel → delete | DELETE | `/api/calendar/events/{id}` | tak** | — |

\* Chat backend nie wymaga tokenu, ale front wywołuje go tylko z `/dashboard` (po zalogowaniu). `session_id` w `sessionStorage`.

\** Backend kalendarza ma hardcoded `user_id = 1` — token jest wysyłany na przyszłość, ale efektywnie wszyscy widzą te same eventy. Patrz "Znane ograniczenia".

## Plan migracji (kroki wysokopoziomowe)

1. **Snapshot** — commit aktualnego stanu, opcjonalny tag `pre-frontend-swap`
2. **Wyczyść `frontend/`** — usuń całą zawartość (zachowaj ewentualnie `.gitignore`)
3. **Skopiuj nowe repo** — pobierz zawartość `plan-pal-ai-27` (bez `.git`, bez `node_modules`) do `frontend/`
4. **`bun install`** w `frontend/`
5. **Baseline build** — `bun run dev`, otwórz `:5173`, potwierdź że appka się renderuje (jeszcze z mockami)
6. **Dodaj warstwę integracji:**
   - `services/authService.js`, `chatService.js`, `calendarService.js` (każdy z własnym inline `fetch`, bez wspólnego klienta)
   - `context/AuthContext.jsx`
   - `components/ProtectedRoute.jsx`
   - Aktualizacja `vite.config.js` (dev proxy `/api` → `localhost:8000`, alias `@` jeśli brakuje)
7. **Podpięcie komponentów** — edycja `Home.jsx`, `Dashboard.jsx`, `main.jsx`:
   - Usunięcie mocków `setTimeout`
   - Wstrzyknięcie `AuthProvider`, `ProtectedRoute`
   - Wywołania serwisów w `AuthDialog`, `ChatPanel` (Dashboard), `CalendarPanel`
   - `ChatPanel` na Home: Send gdy `!user` → `setAuthOpen(true)` zamiast wywołania API
8. **Backend CORS** — w `backend/app/main.py`: usunąć `localhost:3000` i `http://neeklines.xyz`; lista końcowa: `localhost:5173` (bezpiecznik) + `https://neeklines.xyz` (prod)
9. **Aktualizacja `CONTRIBUTIONS.md`** — sekcja "Frontend (React)" w "Development Environment Setup":
   - `cd client` → `cd frontend`
   - `npm install` → `bun install`
   - `npm start` → `bun run dev`
   - Port `:3000` → `:5173`
   - Przy okazji `cd server` → `cd backend` w sekcji backendu (oczywista pomyłka)
10. **E2E test ręcznie:**
    - Rejestracja → auto-login → redirect `/dashboard`
    - Logowanie istniejącym kontem → redirect `/dashboard`
    - Chat: wysyłka wiadomości → odpowiedź Gemini
    - Kalendarz: lista, dodanie, edycja, usunięcie eventu
    - Logout → redirect `/`
    - Refresh strony zalogowanej → sesja przetrwa (token z localStorage)
    - ProtectedRoute: bezpośrednie wejście na `/dashboard` bez tokenu → redirect `/`
11. **Commit** — jako jeden lub kilka logicznych commitów na branchu `frontend-swap`

## Znane ograniczenia (out of scope)

1. **Kalendarz: hardcoded `user_id = 1` w backendzie** — wszyscy zalogowani użytkownicy widzą i edytują te same eventy. Naprawa wymaga refactoringu routera kalendarza (wstrzyknięcie `current_user`). Poza zakresem tego swapu.
2. **Google OAuth znika z UI** — backend nadal wspiera `/api/auth/google-login`, ale nowy `AuthDialog` ma tylko email/password. Można dodać później (osobny task, wymaga `@react-oauth/google` w nowym froncie i `VITE_GOOGLE_CLIENT_ID`).
3. **Chat endpoint w backendzie nie wymaga auth** — frontend gatuje wywołanie (tylko z `/dashboard`), ale ktoś może uderzyć w `/api/chat/` bezpośrednio bez tokenu. Dodanie wymogu auth w backendzie to osobny task (poza zakresem swapu, nie chcemy zmieniać kontraktu).
4. **README.md** — wciąż opisuje "SmartSub" zamiast "Student Assistant". Rebranding poza zakresem tego designu (osobny task).
5. **Reset password / Forgot password** — brak na obu stronach (stare wymaganie z SCOPE.md jako "tylko widok atrapy"). Nie dodajemy.

## Definicja sukcesu

Po wdrożeniu, na lokalnej maszynie:

- `cd backend && uvicorn app.main:app --reload` uruchamia backend na `:8000`
- `cd frontend && bun install && bun run dev` uruchamia frontend na `:5173`
- Pełna ścieżka: otwarcie `/`, rejestracja, automatyczne przejście na `/dashboard`, użycie czatu i kalendarza, logout
- Na Home: kliknięcie "Wyślij" w ChatPanel gdy niezalogowany → otwiera AuthDialog
- Brak błędów w konsoli przeglądarki i w logach backendu (poza znanymi ograniczeniami powyżej)
- `CONTRIBUTIONS.md` ma poprawne instrukcje uruchomienia frontu (Bun, `:5173`)
- Brak `.env` w `frontend/` — wszystko działa z relatywnymi ścieżkami i Vite proxy
