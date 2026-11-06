# Przewodnik testowania (gałąź `develop`)

## 1. Uruchomienie
```bash
npm install
npm run supabase:start                       # lokalny Supabase w Dockerze (pierwszy start pobiera obrazy)
supabase status -o env                       # skopiuj API_URL, ANON_KEY, SERVICE_ROLE_KEY
cp .env.development.example .env.local       # wpisz: NEXT_PUBLIC_SUPABASE_URL=<API_URL>, …ANON_KEY=<ANON_KEY>, SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
npm run db:seed                              # dane demo + konto testowe
npm run dev                                  # http://localhost:3000
```
`.env.local` jest ignorowany przez git. Lokalne klucze Supabase są publicznie znanymi kluczami demo.
Zatrzymanie: `Ctrl+C`, a Supabase: `supabase stop` (z `--no-backup` usuwa też dane).
Uwaga: Docker Desktop potrzebuje ok. 6–8 GB wolnego miejsca w „Disk image size” (Settings → Resources).

## 2. Scenariusze ręczne
- **Strona główna** `http://localhost:3000`: przypięte ogłoszenie na górze, etykiety klas, terminy („Jutro”, „Za 3 dni”), data wygaśnięcia; wygasłe („Kiermasz ciast”) nie widać.
- **Filtr klasy:** kliknij „Klasa 7A” → ogłoszenia 7A + całej szkoły.
- **Dodaj do kalendarza:** przycisk przy ogłoszeniu z terminem pobiera plik `.ics` (otwórz w Kalendarzu/Google Calendar – termin + przypomnienie dzień wcześniej).
- **Panel:** `http://localhost:3000/admin/logowanie` → `admin@example.test` / `Admin123!`.
  - *Dodaj ogłoszenie:* tytuł, treść, klasa, termin, wygaśnięcie, „Przypnij na górze”.
  - *Edytuj / Przypnij / Usuń* (usuwanie pyta o potwierdzenie).
  - *Klasy:* dodaj klasę; klasy z ogłoszeniami nie da się usunąć.
  - Ogłoszenie z wygaśnięciem za minutę zniknie z listy publicznej, a w panelu dostanie etykietę „Wygasło”.

## 3. Sprawdzanie zabezpieczeń
1. Bez logowania wejdź na `/admin` lub `/admin/nowe` → przekierowanie na logowanie.
2. Zły e-mail/hasło → ten sam komunikat; po 5 próbach blokada na 15 minut.
3. Zalogowany zwykły użytkownik Supabase (bez wpisu w `admins`) nie wejdzie do panelu i nie zapisze danych (testy `test:rls`).
4. `curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/announcements" -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Content-Type: application/json" -d '{"title":"Włamanie"}'` → błąd (RLS), nic nie zapisano.
5. Wygasłe ogłoszenie nie jest dostępne publicznie ani przez API, ani przez `.ics` (404).

## 4. Testy automatyczne
```bash
npx playwright install chromium        # raz
npm run typecheck && npm test          # jednostkowe
npm run test:rls                       # autoryzacja na prawdziwej bazie (wymaga działającego Supabase)
npm run test:security                  # reguły produkcji + kontrola skryptu + RLS
npm run test:e2e                       # seed + Playwright (desktop, telefon, tablet, axe) – serwer na porcie 3100
npm run build && npm run test:prod     # wersja produkcyjna (odrzucanie konta deweloperskiego, brak tras debug)
```
`test:e2e` czyści i ponownie zasila bazę deweloperską (seed). Test wygasania czeka ~1 minutę.

## 5. Reset danych
`npm run db:reset` (lokalnie: ponowne zastosowanie migracji + seed) albo `npm run db:seed` (tylko dane).

## 6. Test wersji produkcyjnej lokalnie
```bash
npm run build && npm run test:prod
```
Test uruchamia serwer z `APP_ENV=production` i sprawdza: logowanie `admin@example.test` odrzucone (mimo że lokalna baza ma to konto), panel wymaga logowania, trasy debug → 404.

## 7. Sprawdzenie, że konto testowe nie działa na `main`
```bash
node scripts/prepare-main.mjs /ścieżka/do/kopii && cd /ścieżka/do/kopii
npm run check:main                     # ✔ Production safety check passed (main-branch scan included)
npm ci && npm run build && npm run test:prod
```
Nie uruchamiaj `prepare:main` w swoim katalogu roboczym na `develop` (usuwa seed i testy e2e).
