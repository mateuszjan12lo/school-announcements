# Konto demonstracyjne – WYŁĄCZNIE ŚRODOWISKO DEWELOPERSKIE

> ⚠️ **Tylko `develop` / lokalna lub deweloperska baza Supabase.** To konto powstaje wyłącznie w `scripts/seed-dev.mjs`.
> Nie istnieje w produkcji: aplikacja produkcyjna odrzuca każdy adres `@example.test` jeszcze przed zapytaniem do Supabase,
> a `npm run verify:prod-db` sprawdza, że nie ma go w bazie produkcyjnej. **Nigdy nie używaj tego hasła w prawdziwym środowisku.**
> Ten plik nie istnieje na `main`.

| Rola | E-mail | Hasło | Logowanie |
|---|---|---|---|
| Administrator | `admin@example.test` | `Admin123!` | `/admin/logowanie` |

Hasło można zmienić zmienną `DEV_ADMIN_PASSWORD` przed `npm run db:seed` (Supabase wymaga min. 6 znaków – hasło `admin` nie zostanie przyjęte).
