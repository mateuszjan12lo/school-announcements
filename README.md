# SchoolPulse – ogłoszenia szkolne

Proste ogłoszenia szkolne po polsku. **Strona publiczna** pokazuje aktualne ogłoszenia, a **panel administratora**
(tylko po zalogowaniu) pozwala je dodawać, edytować, przypinać i usuwać.

Każde ogłoszenie ma: tytuł, treść, **klasę** (której dotyczy albo „Cała szkoła”), **przypięcie**, **termin**
(z przyciskiem „Dodaj do kalendarza” – plik `.ics` z przypomnieniem dzień wcześniej) oraz **datę wygaśnięcia**
(po niej ogłoszenie znika z listy publicznej, ale zostaje w panelu).

Technologia: Next.js 16 (App Router) + TypeScript + Tailwind, **Supabase** (Auth, PostgreSQL z RLS), wdrożenie na **Vercel**. PWA (manifest, ekran offline).

| Adres | Co to |
|---|---|
| `/` | publiczna lista ogłoszeń (przypięte na górze, filtr klasy, stronicowanie po 20) |
| `/admin/logowanie` → `/admin` | logowanie i panel administratora |
| `/ogloszenia/<id>/kalendarz.ics` | pobranie terminu do kalendarza |
| `/api/health` | sprawdzenie, że aplikacja działa |

## Szybki start (lokalnie)
Wymagane: Node 24, Docker (dla lokalnego Supabase), Supabase CLI.
```bash
npm install
npm run supabase:start           # lokalny Supabase (stosuje migracje z supabase/migrations)
supabase status -o env           # wartości do .env.local – patrz TESTING.md
cp .env.development.example .env.local   # i uzupełnij klucze z powyższego polecenia
npm run db:seed                  # dane demo + konto testowe (TYLKO baza deweloperska)
npm run dev                      # http://localhost:3000
```
Konto testowe (tylko `develop`): [DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md). Panel: http://localhost:3000/admin/logowanie

## Polecenia
| Polecenie | Działanie |
|---|---|
| `npm run dev` / `build` / `start` | tryb deweloperski / build (poprzedzony kontrolą bezpieczeństwa) / start |
| `npm test` | testy jednostkowe (wygasanie, `.ics`, walidacja, czas polski, reguły produkcji) |
| `npm run test:rls` | testy autoryzacji na prawdziwej bazie (lokalny Supabase) |
| `npm run test:security` | reguły produkcji + kontrola skryptu + testy RLS |
| `npm run test:e2e` | seed + testy Playwright (przepływy, panel, dostępność, RWD) |
| `npm run test:prod` | testy zbudowanej wersji produkcyjnej (po `npm run build`) |
| `npm run check:main` / `prepare:main` | kontrola / przygotowanie drzewa gałęzi `main` |
| `npm run verify:prod-db` | sprawdza, że w produkcyjnej bazie nie ma kont deweloperskich |
| `npm run db:migrate` | `supabase db push` (migracje do podlinkowanego projektu) |
| `npm run db:seed` / `db:reset` | seed deweloperski / reset lokalnej bazy + seed |

## Bezpieczeństwo w skrócie
- **RLS w bazie:** publicznie widać tylko niewygasłe ogłoszenia; zapis tylko dla administratora (tabela `admins`). Rola nigdy nie pochodzi z przeglądarki.
- Panel: sesja Supabase walidowana na serwerze przy każdej stronie i akcji; zapisy idą kontem użytkownika, więc RLS egzekwuje to niezależnie od kodu aplikacji.
- Klucz `service_role` nie występuje w kodzie aplikacji (tylko w skryptach seed/weryfikacji uruchamianych ręcznie).
- Konto `admin@example.test` powstaje wyłącznie w skrypcie seed dla bazy deweloperskiej; aplikacja produkcyjna odrzuca je w kodzie; skrypty i testy blokują produkcję.
- Treść ogłoszeń to zwykły tekst (React go escapuje, brak `dangerouslySetInnerHTML`).

## Ograniczenia
- Tylko jedna rola (administrator), bez kont uczniów/rodziców, komentarzy, powiadomień push/e-mail, załączników i obrazów.
- Limit logowania w aplikacji działa per instancja serwera (najlepsza próba); właściwy limit zapewnia Supabase Auth.
- Skrócenie sesji administratora do 2 h (`timebox`) wymaga planu Pro w Supabase; na darmowym planie sesja odświeża się ciasteczkami.
- Konfiguracja Docker + Supabase **nie została zweryfikowana** w ostatniej wersji (brak miejsca na dysku Dockera); `npm run dev` jest zweryfikowany.
- Wdrożenie na Vercel i na chmurowy Supabase nie było jeszcze wykonane.

Wdrożenie: [DEPLOYMENT.md](DEPLOYMENT.md) · Testowanie: [TESTING.md](TESTING.md) · Lista kontrolna: [TEST_CHECKLIST.md](TEST_CHECKLIST.md)
