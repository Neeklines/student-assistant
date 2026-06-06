# Roadmap — co dalej

Lista zadań do zrobienia po MVP. Każdy punkt to osobny PR (zgodnie z [CONTRIBUTIONS.md](../CONTRIBUTIONS.md)).

Stan na 2026-06-06. Co już zostało zrobione: [SCOPE.md](../SCOPE.md).

## Priorytet wysoki

- [ ] **Widok kalendarza dzień / tydzień / miesiąc.**
  Aktualnie Dashboard pokazuje płaską listę. Trzeba dodać przełącznik perspektywy + komponent
  siatki tygodniowej i miesięcznej. Sugerowane biblioteki: `@fullcalendar/react` lub własna siatka
  na CSS grid (lżejsza, lepiej kontrolowana).

## Priorytet średni

- [ ] **Decyzja produktowa: chat na [Home.jsx](../frontend/src/pages/Home.jsx) dla niezalogowanych.**
  Dziś `send()` na landingu tylko otwiera modal logowania — czat jest atrapą. Backend wymaga już
  auth, więc trzeba zdecydować: zostawić gating ("najpierw się zaloguj") czy pozwolić na N darmowych
  wiadomości bez konta (np. przez przejściowy guest-token). Zalecane: zostawić gating do MVP, drugą
  opcję rozważyć przy mierzonej konwersji.

- [ ] **Onboarding po rejestracji.**
  Po pierwszym logowaniu pokazać krótki tour: "tu jest czat, tu kalendarz, kliknij paperclip żeby
  dodać obraz". Bez tego nowy użytkownik dostaje pusty Dashboard i nie wie co zrobić.

- [ ] **Powiadomienia wizualne o nadchodzących wydarzeniach.**
  Toast/banner na pulpicie: "Za 15 minut: Algebra (sala 4.07)". Wymaga lekkiego polleru w frontendzie
  albo Server-Sent Events z backendu.

## Priorytet niski (cleanup)

- [ ] **Migracja `passlib` na `argon2-cffi` bezpośrednio.**
  Dziś `passlib` 1.7.4 jest ostatnim release-em i wciska deprecated `argon2.__version__`. Aktualnie
  uciszamy warning w [pytest.ini](../backend/pytest.ini). Docelowo: zrezygnować z passlib na rzecz
  bezpośredniego API `argon2.PasswordHasher` w [backend/app/core/security.py](../backend/app/core/security.py)
  i [backend/app/services/auth_service.py](../backend/app/services/auth_service.py).

- [ ] **Reset session_id przy wylogowaniu.**
  `chatService.resetSessionId()` istnieje, ale nie jest wywoływane w `logout()` w [AuthContext](../frontend/src/context/AuthContext.jsx).
  Po wylogowaniu i zalogowaniu na inne konto rozmowa "skleja się" w jednej sesji w sessionStorage.
