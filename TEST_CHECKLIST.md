# Lista kontrolna testów  ([A] = test automatyczny, [R] = ręcznie)

## Ogłoszenia publiczne
- [ ] [A] Pierwszy ekran po polsku, bez logowania; `lang="pl"`; brak odnośnika do panelu
- [ ] [A] Przypięte na górze; wygasłe ukryte; klasa, termin i data wygaśnięcia widoczne
- [ ] [A] Filtr klasy (klasa + cała szkoła); [R] stronicowanie (>20 ogłoszeń)
- [ ] [A] „Dodaj do kalendarza” pobiera poprawny `.ics`; 404 dla braku terminu / wygasłego / nieistniejącego
- [ ] [R] Plik `.ics` otwiera się w Kalendarzu (iOS/Android/Google) z przypomnieniem
- [ ] [A] Strefa czasu: terminy w czasie polskim (lato/zima)

## Panel administratora
- [ ] [A] Bez logowania → logowanie; wylogowanie kończy sesję
- [ ] [A] Dodawanie, edycja, przypinanie, usuwanie z potwierdzeniem
- [ ] [A] Walidacja po polsku; formularz zachowuje wpisane dane po błędzie
- [ ] [A] Wygaśnięcie: po upływie czasu znika z listy publicznej, zostaje w panelu
- [ ] [A] Klasy: dodawanie, brak usuwania klasy w użyciu
- [ ] [A] Blokada po 5 nieudanych logowaniach

## Baza i RLS (prawdziwy Postgres)
- [ ] [A] Anon widzi tylko niewygasłe; nie widzi `admins`
- [ ] [A] Anon i zwykły użytkownik: INSERT/UPDATE/DELETE odrzucone; nie nadadzą sobie roli admina
- [ ] [A] Admin: pełne CRUD; ograniczenia CHECK / UNIQUE / ON DELETE RESTRICT
- [ ] [A] Zapis anonimowy przez REST API → odrzucony

## Produkcja
- [ ] [A] Aplikacja produkcyjna odrzuca `admin@example.test`; brak banera deweloperskiego; brak tras debug
- [ ] [A] Kontrola konfiguracji: debug, dane dev, seed, adres Supabase dev, klucz service_role z `NEXT_PUBLIC_`
- [ ] [A] Seed odmawia pracy w produkcji / bez `SEED_ENV` / na obcym adresie
- [ ] [A] Drzewo `main`: `check:main`, build, testy produkcyjne
- [ ] [R] `npm run verify:prod-db` na prawdziwej bazie produkcyjnej: ✔ (brak kont dev, hasła testowe odrzucone)
- [ ] [A] Klucz `service_role` nie występuje w kodzie dla przeglądarki

## PWA, RWD, dostępność
- [ ] [A] Offline → komunikat po polsku; [R] instalacja PWA (Chrome/Android, iOS „Dodaj do ekranu głównego”)
- [ ] [A] Brak poziomego przewijania i przyciski ≥ 44 px (telefon, tablet, desktop); axe WCAG A/AA
