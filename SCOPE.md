## Cel projektu

Celem projektu jest zaprogramowanie i uruchomienie działającego prototypu aplikacji
**Studybuddy** — planera dnia studenta wspieranego przez asystenta AI. Cel uznamy za
spełniony, gdy użytkownik będzie mógł:

* założyć konto i się zalogować (e-mail/hasło lub Google),
* porozmawiać z asystentem AI o swoich planach na dzień / tydzień,
* dodać co najmniej 3 wydarzenia do kalendarza (zarówno ręcznie, jak i przez rozmowę z asystentem),
* zobaczyć w pulpicie listę wydarzeń posortowanych po czasie startu,
* załączyć w czacie zdjęcie (np. plan zajęć / sylabus) i otrzymać od AI odpowiedź uwzględniającą jego treść.

---

## Zakres IN

- [x] Moduł rejestracji i logowania użytkownika (e-mail/hasło, JWT)
- [x] Logowanie przez Google OAuth
- [x] Czat z asystentem AI (OpenAI `gpt-4o-mini`) z historią rozmowy per użytkownik
- [x] Załączanie obrazów w czacie (JPEG/PNG/WebP, do 5MB) z walidacją po obu stronach
- [x] Kalendarz wydarzeń — CRUD przez REST API, ścisła izolacja per użytkownik
- [x] Pulpit (Dashboard) prezentujący czat i listę wydarzeń obok siebie
- [x] Responsywny interfejs (React 19 + Tailwind v4) dostosowany do ekranów mobilnych i desktop
- [ ] **Integracja AI ↔ kalendarz** — asystent może odczytywać i tworzyć wydarzenia przez tool calling OpenAI
- [ ] Widok kalendarza w układzie miesiąc / tydzień / dzień
- [ ] Powiadomienia wizualne (banery / toast) o nadchodzących wydarzeniach
- [ ] Onboarding dla nowego użytkownika

---

## Zakres OUT

* Rzeczywista integracja z Google Calendar / Apple Calendar (synchronizacja dwustronna)
* Powiadomienia push / SMS / e-mail na fizyczne urządzenie (zastępujemy je alertami w samej aplikacji)
* Odzyskiwanie zapomnianego hasła przez realny e-mail (tylko atrapa UI)
* Współdzielenie kalendarza między użytkownikami / "team plan"
* Mobilne aplikacje natywne (iOS/Android) — celujemy w PWA
* Generowanie głosowych odpowiedzi przez asystenta (text-to-speech)
* Płatności / plany subskrypcyjne — projekt nieprofitowy, edukacyjny
