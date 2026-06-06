# Roadmap

Lista zadań do zrobienia po MVP. Każdy punkt to osobny PR (zgodnie z [CONTRIBUTIONS.md](../CONTRIBUTIONS.md)).

Stan na 2026-06-06.

---

## Co już mamy

Patrz: [README.md](../README.md), [SCOPE.md](../SCOPE.md). W skrócie: rejestracja + JWT + Google OAuth (backend), kalendarz CRUD z izolacją per-user, czat z Buddy (OpenAI `gpt-4o-mini`) z obrazami, integracja AI ↔ kalendarz przez function calling, testy backendu (16/16).

---

## Sugerowana kolejność — następne 2-3 PR-y

Mix user-facing + tech debt, żeby utrzymać tempo i nie tworzyć długu w żadną stronę:

1. **`feature/calendar-event-actions`** — edycja i usuwanie eventu z UI (najbardziej brakuje przy codziennym używaniu)
2. **`chore/alembic-migrations`** — wprowadzić Alembic, zanim schemat się rozrośnie (`Base.metadata.create_all` zacznie cicho gubić zmiany)
3. **`feature/chat-streaming`** — Server-Sent Events na odpowiedź Buddy'ego (dziś 3-10 s ciszy)

---

## Funkcjonalność kalendarza

- [ ] **Edycja eventu z UI** — klik w bańkę → modal z formularzem. Backend (`PUT /api/calendar/events/{id}`) już jest gotowy.
- [ ] **Usuwanie eventu z UI** — przycisk X na bańce + confirm dialog. Backend gotowy.
- [ ] **Widok kalendarza dzień / tydzień / miesiąc** — przełącznik perspektywy + komponent siatki. Sugerowane: `@fullcalendar/react` lub własna siatka CSS grid.
- [ ] **Powtarzające się wydarzenia** — np. "wykłady co tydzień we wtorki 10:00". Wymaga rozszerzenia `CalendarEvent` o `recurrence_rule` (RFC 5545 RRULE) lub osobnej tabeli `recurrence_pattern`.
- [ ] **Kolorowe tagi per `event_type`** — wizualne rozróżnienie wykładu, sesji nauki, przerwy, deadline'u na liście i w przyszłym kalendarzu.
- [ ] **Drag-and-drop** w widoku week/day — gdy będzie siatka kalendarza.
- [ ] **Filtr "tylko od Buddy'ego"** — pole `created_by="ai"` już jest w bazie, brak UI.

---

## Chat / AI UX

- [ ] **Streaming odpowiedzi (SSE)** — dziś użytkownik czeka w ciszy. OpenAI obsługuje `stream=True`, FastAPI ma `StreamingResponse`.
- [ ] **Przycisk "Nowy chat"** — `chatService.resetSessionId()` istnieje, brak UI.
- [ ] **Cancel button** podczas generowania (`AbortController` na froncie + przerwanie strumienia na backendzie).
- [ ] **Quick replies** — sugerowane odpowiedzi po wiadomości AI ("Tak, zapisz" / "Popraw godzinę" / "Pokaż wszystko").
- [ ] **Sidebar z historią rozmów** — wiele sesji na konto, nie tylko jedna w sessionStorage.
- [ ] **Rate limiting per user** — np. 50 wiadomości / dobę. Chroni klucz OpenAI przed wyciekiem kosztów. Sugerowane: `slowapi` lub własny middleware.
- [ ] **Decyzja produktowa: chat na [Home.jsx](../frontend/src/pages/Home.jsx) dla niezalogowanych** — dziś atrapa otwierająca modal logowania. Opcja: N darmowych wiadomości przez guest-token. Zalecane: zostawić gating do mierzonej konwersji.

---

## Auth / profil

- [ ] **Strona profilu** — imię, awatar (upload), preferencje (np. domyślna długość bloku nauki, godziny aktywne).
- [ ] **Zmiana hasła** — brak endpointu i UI.
- [ ] **Wpięcie Google OAuth w UI** — backend ma `/api/auth/google-login`, frontend nie ma przycisku.
- [ ] **Onboarding po rejestracji** — krótki tour Dashboard-a po pierwszym logowaniu. Bez tego nowy user widzi pusty ekran i nie wie co zrobić.
- [ ] **Lepsze komunikaty błędów na formularzach** — dziś generyczne "Logowanie nie powiodło się"; pole-by-pole walidacja + komunikaty po polsku.
- [ ] **Wylogowanie ze wszystkich urządzeń** — w praktyce: bumpnąć `users.token_version` i odrzucać starsze tokeny.

---

## Powiadomienia

- [ ] **Powiadomienia wizualne o nadchodzących wydarzeniach** — toast/banner na pulpicie: "Za 15 minut: Algebra". Lekki poller co minutę albo SSE z backendu.

---

## Tech debt + bezpieczeństwo

- [ ] **Alembic dla migracji** — `Base.metadata.create_all` nie wykryje `DROP COLUMN`, zmiany typu, etc. Im wcześniej tym mniej bólu.
- [ ] **Frontend lint (ESLint + plugin React)** — brak konfigu w `package.json`, błędy hooków przejdą cicho.
- [ ] **Frontend testy (Vitest + React Testing Library)** — żaden komponent nie jest pokryty.
- [ ] **CI: frontend build job** — dziś `.github/workflows/backend-ci.yml` puszcza tylko backend; PR z zepsutym frontem przejdzie CI.
- [ ] **Pre-commit hooks** (`pre-commit` framework) — black + flake8 + eslint przed commitem, nie po push.
- [ ] **Rate limiting na `/api/auth/login`** — brute-force protection. Bez tego można zgadywać hasła w nieskończoność.
- [ ] **Pełna migracja `passlib` → `argon2-cffi`** bezpośrednio — dziś tylko warning uciszony w `pytest.ini`.
- [ ] **Email verification po rejestracji** — sandbox / mock w dev, realne wysyłanie przed prodem.
- [ ] **Structured logging** (np. `structlog` JSON) — pod monitoring i debugging.
- [ ] **Sentry / error tracking** — `sentry-sdk[fastapi]` + DSN z env.
- [ ] **Health check sprawdzający DB** — dziś `/api/health/` zwraca `ok` bez sprawdzania bazy.
- [ ] **Docker Compose dla dev** — `docker compose up` = backend + frontend + (opcjonalnie) MySQL w tle.

---

## Maintenance (drobiazgi)

Małe rzeczy, które łatwo złapać przy okazji większych zmian:

- [ ] **Reset `session_id` przy wylogowaniu** — `chatService.resetSessionId()` istnieje, ale `AuthContext.logout()` go nie woła. Konsekwencja: po wylogowaniu i zalogowaniu na inne konto rozmowa "skleja się" w jednej sesji w sessionStorage.
- [ ] **Usunąć `frontend/.lovable/`** z repo — artefakt narzędzia Lovable, nie powinien być trackowany. Dodać do `.gitignore`.
- [ ] **Sprawdzić `passlib` 1.7.4 deprecation timeline** — jeśli pojawi się nowy release, podnieść i usunąć filter z `pytest.ini`.
