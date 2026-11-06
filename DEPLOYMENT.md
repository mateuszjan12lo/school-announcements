# Wdrożenie: Vercel + Supabase (darmowe plany)

> **Status:** schemat, RLS, seed, testy i kontrole produkcyjne są sprawdzone **lokalnie** (lokalny Supabase). Wdrożenie na Vercel i
> chmurowy Supabase nie było jeszcze wykonane – ta instrukcja jest gotowa do przejścia krok po kroku, ale pierwszy raz trzeba ją
> potraktować jako test. Nie wklejaj kluczy do czatu, do repozytorium ani do plików z gitem.

## Środowiska

| Środowisko | Gałąź | Hosting | Baza |
|---|---|---|---|
| Lokalne | dowolna | `npm run dev` (lub Docker) | lokalny Supabase (`supabase start`) |
| **Preview** | `develop` | Vercel Preview | **osobny** projekt Supabase „deweloperski” |
| **Produkcja** | `main` | Vercel Production | **osobny** projekt Supabase „produkcyjny” |

`develop` **nigdy** nie łączy się z bazą produkcyjną: zmienne Preview i Production w Vercel są rozdzielone (krok 4).

## 1. Projekt Supabase – deweloperski
1. https://supabase.com → *New project* → nazwa np. `schoolpulse-dev`, region UE, silne hasło bazy (zapisz w menedżerze haseł).
2. *Project Settings → API*: skopiuj **Project URL**, klucz **anon** i klucz **service_role** (ten ostatni to sekret – tylko do Vercel/lokalnego `.env.local`).
3. Zastosuj migracje: `supabase login`, `supabase link --project-ref <ref-dev>`, `npm run db:migrate` (czyli `supabase db push`).
4. Seed deweloperski (tworzy konto testowe i dane demo – **tylko tu**):
   ```bash
   # w .env.local: URL, ANON, SERVICE_ROLE z projektu DEV + SEED_ENV=development
   npm run db:seed
   ```
   Skrypt odmawia pracy, gdy `NODE_ENV/APP_ENV/VERCEL_ENV=production`, bez `SEED_ENV=development` lub gdy adres to `PRODUCTION_SUPABASE_URL`.

## 2. Projekt Supabase – produkcyjny
1. *New project* → np. `schoolpulse-prod`, **inne hasło bazy** niż w dev.
2. *Authentication → Providers → Email*: **wyłącz „Allow new users to sign up”** (administratorów dodajesz ręcznie). Włącz potwierdzenia e-mail i ustaw rozsądne limity w *Authentication → Rate Limits*.
3. Migracje (bez żadnych danych): `supabase link --project-ref <ref-prod>` → `supabase db push`. Migracje zawierają wyłącznie schemat i RLS (sprawdza to skan `check:main`).
4. **Pierwszy administrator** – ręcznie, bez skryptów deweloperskich:
   - *Authentication → Users → Add user* (prawdziwy e-mail, silne hasło, „Auto confirm”).
   - *SQL Editor*: `insert into public.admins (user_id) select id from auth.users where email = 'dyrektor@twojaszkola.pl';`
5. Weryfikacja czystości bazy (patrz sekcja „Weryfikacja”).

## 3. Lokalne środowisko (Docker/Supabase)
Patrz [TESTING.md](TESTING.md): `npm run supabase:start`, `.env.local`, `npm run db:seed`, `npm run dev`.
Docker Desktop: zwiększ *Disk image size* (Settings → Resources) – obrazy Supabase zajmują ok. 4–5 GB.
`docker compose up --build` uruchamia aplikację w kontenerze, łącząc się z lokalnym Supabase przez `host.docker.internal` (konfiguracja niezweryfikowana po ostatnich zmianach).

## 4. Vercel
1. *Add New → Project* → import repozytorium `mat-jan/school-announcements`. Framework: Next.js (wykryje sam; `vercel.json` ustawia nagłówki bezpieczeństwa).
2. *Settings → Git*: **Production Branch = `main`**. Gałąź `develop` automatycznie dostaje wdrożenia **Preview**.
3. *Settings → Environment Variables* – ustaw **osobno** dla każdego środowiska:

| Zmienna | Preview (develop) | Production (main) |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL projektu **DEV** | URL projektu **PROD** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon **DEV** | anon **PROD** |
| `SUPABASE_SERVICE_ROLE_KEY` | *(niepotrzebny aplikacji – nie ustawiaj)* | *(nie ustawiaj)* |
| `NEXT_PUBLIC_APP_URL` | *(opcjonalnie)* adres Preview | *(zalecane)* stały adres produkcyjny, np. `https://szkola.example` – to on trafia do kodu QR na `/instalacja` |
| `APP_ENV` | `development` | `production` |

   **Nie ustawiaj** w Production: `DEBUG`, `SEED_ENV`, `DEV_ADMIN_EMAIL`, `DEV_ADMIN_PASSWORD`, `RUN_DEV_SEED` – build się przerwie (kontrola `prebuild`).
   Aplikacja nie używa klucza `service_role` – jest on potrzebny tylko skryptom uruchamianym ręcznie (`db:seed`, `verify:prod-db`) i nigdy nie trafia do kodu przeglądarki.
4. *Settings → Deployment Protection*: włącz **Vercel Authentication** dla Preview, aby wersja z kontem testowym nie była publiczna.
5. Obrazy/załączniki: aplikacja ich nie obsługuje (brak `images.remotePatterns`, brak uploadu), więc nie ma tu dodatkowej konfiguracji ani kosztów transferu.

## 5. `develop` → Vercel Preview
Push na `develop` → automatyczne wdrożenie Preview. Wejdź na adres Preview (po zalogowaniu do Vercel), potem `/admin/logowanie` i konto z [DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md) (utworzone seedem w bazie DEV).

## 6. `main` → Vercel Production
1. Przygotuj drzewo: `git switch -c release/main-prep develop && npm run prepare:main && npm run check:main` (usuwa seed, Docker, testy e2e i dokumenty testowe).
2. Zatwierdź, otwórz PR do `main`. W CI muszą przejść: `check:main`, `typecheck`, `test:security`, `build`, `test:prod`.
3. Przed merge: `npm run verify:prod-db` (z danymi **produkcyjnymi** w zmiennych środowiskowych tej sesji).
4. Merge → wdrożenie Production. **Nie scalaj `develop` bezpośrednio do `main`** – przywróciłoby seed i konto testowe.

### Lista kontrolna wdrożenia
- [ ] Dwa osobne projekty Supabase (dev i prod), różne hasła i klucze
- [ ] Production: rejestracja użytkowników wyłączona, pierwszy administrator dodany ręcznie
- [ ] Zmienne Preview wskazują DEV, zmienne Production wskazują PROD (sprawdź raz jeszcze!)
- [ ] `npm run check:main` ✔, `npm run test:prod` ✔, build na Vercel ✔
- [ ] `npm run verify:prod-db` ✔
- [ ] Preview chronione (Vercel Authentication)
- [ ] Logowanie prawdziwym kontem administratora działa, `admin@example.test` – nie

## Weryfikacja: konto testowe działa tylko w developmencie
- **Dev:** wejdź na `/admin/logowanie` w Preview/lokalnie → `admin@example.test` / `Admin123!` → panel.
- **Produkcja:** ten sam adres i hasło na adresie produkcyjnym → „Nieprawidłowy adres e-mail lub hasło” (aplikacja odrzuca `@example.test` w kodzie, zanim zapyta Supabase).
- **Baza:** `npm run verify:prod-db` (zmienne produkcyjne) sprawdza, że w bazie nie ma żadnego konta `@example.test`, hasła testowe nie działają i nie ma ich w `admins`. Zwraca kod 1, jeśli cokolwiek znajdzie.
- **Kod:** `npm run check:main` + `npm run test:prod` (logowanie kontem deweloperskim odrzucone, brak tras debug/testowych). Seed odmawia pracy w produkcji.

## Backup i eksport (darmowy plan)
Darmowy plan Supabase **nie ma automatycznych kopii zapasowych do przywracania**. Rób eksport ręcznie (np. co tydzień i przed migracjami):
```bash
supabase db dump --linked -f backup-$(date +%F)-schema.sql
supabase db dump --linked --data-only -f backup-$(date +%F)-data.sql
```
Przechowuj kopie poza repozytorium (zawierają dane). Przywracanie: nowy projekt → `supabase db push` → import `…-data.sql`. Konta (`auth.users`) eksportuj osobno lub utwórz administratora ponownie.

## Limity darmowych planów i monitorowanie
| | Supabase Free | Vercel Hobby |
|---|---|---|
| Baza | 500 MB | – |
| Transfer | ok. 5 GB/mies. | ok. 100 GB/mies. |
| Aktywność | projekt **pauzuje po ok. 7 dniach bez ruchu** | wyłącznie użytek niekomercyjny |
| Inne | limity Auth (e-maile, MAU), brak backupów | limity wywołań funkcji i czasu |

Monitoring: Supabase → *Project Settings → Usage* (baza, transfer, MAU); Vercel → *Usage* (transfer, wywołania funkcji). Ustaw przypomnienie co miesiąc.
Aplikacja oszczędza zasoby: indeksy pod listę publiczną, stronicowanie po 20 (jedno zapytanie na stronę), brak realtime, brak zadań w tle, brak obrazów, publiczny odczyt bez sesji.

### Co zrobić, gdy limity zostaną osiągnięte
- **Projekt Supabase spauzowany:** *Dashboard → Restore project* (dane zostają). Zaloguj się do panelu raz w tygodniu lub ustaw zewnętrzne, darmowe pingowanie `/` (odczyt z bazy podtrzymuje aktywność).
- **Zbliża się 500 MB / transfer:** usuń stare, wygasłe ogłoszenia (panel → Usuń), zmniejsz długość treści; rozważ plan Pro Supabase (backupy, brak pauzy).
- **Limity Vercel Hobby:** zmniejsz ruch (cache), a przy użyciu komercyjnym wymagany jest plan Pro.
- **Awaria po przekroczeniu:** strona publiczna pokaże pustą listę – sprawdź *Usage* w obu panelach.
- Droga rozwoju bez przepisywania: ten sam kod działa na planach płatnych; dodanie obrazów = bucket Storage + migracja.

## Wersje i zgodność
Migracje: `supabase/migrations/20261106000001_ogloszenia.sql` (jedna, idempotentna na świeżej bazie). Kolejne zmiany dodawaj jako nowe pliki – nigdy nie edytuj zastosowanych migracji na produkcji.
