#!/usr/bin/env node
// Seed DEWELOPERSKI: czyści ogłoszenia i klasy, tworzy konto testowe administratora i dane demo.
// Odmawia uruchomienia, jeśli cokolwiek wskazuje na produkcję. NIGDY nie uruchamiaj w produkcyjnym projekcie Supabase.
import { createClient } from "@supabase/supabase-js";

const env = process.env;
const die = (m) => { console.error(`✖ ${m}`); process.exit(1); };
if (["NODE_ENV", "APP_ENV", "VERCEL_ENV"].some((k) => env[k] === "production")) die("Odmowa: seed deweloperski jest zablokowany w środowisku produkcyjnym.");
if (env.SEED_ENV !== "development") die("Odmowa: ustaw jawnie SEED_ENV=development (potwierdzenie, że to baza deweloperska).");
const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) die("Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY.");
if (env.PRODUCTION_SUPABASE_URL && url === env.PRODUCTION_SUPABASE_URL) die("Odmowa: adres Supabase jest adresem PRODUKCYJNYM.");
if (!/^(https?:\/\/(127\.0\.0\.1|localhost|host\.docker\.internal)|https:\/\/[a-z0-9]+\.supabase\.co)/.test(url)) die("Odmowa: nierozpoznany adres Supabase.");

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const must = (r, what) => { if (r.error) die(`${what}: ${r.error.message}`); return r.data; };
const EMAIL = env.DEV_ADMIN_EMAIL ?? "admin@example.test", PASSWORD = env.DEV_ADMIN_PASSWORD ?? "Admin123!";

// Konto administratora (tylko to skrypt deweloperski tworzy konto testowe).
const list = must(await sb.auth.admin.listUsers({ perPage: 200 }), "listUsers");
let user = list.users.find((u) => u.email === EMAIL);
if (!user) user = must(await sb.auth.admin.createUser({ email: EMAIL, password: PASSWORD, email_confirm: true }), "createUser").user;
else must(await sb.auth.admin.updateUserById(user.id, { password: PASSWORD }), "updateUser");
must(await sb.from("admins").upsert({ user_id: user.id }), "admins");

// Dane demo (idempotentnie: czyścimy i wstawiamy od nowa).
must(await sb.from("announcements").delete().not("id", "is", null), "czyszczenie ogłoszeń");
must(await sb.from("classes").delete().not("id", "is", null), "czyszczenie klas");
const classes = must(await sb.from("classes").insert([{ name: "Klasa 7A" }, { name: "Klasa 7B" }, { name: "Klasa 6A" }]).select(), "classes");
const C = Object.fromEntries(classes.map((c) => [c.name, c.id]));
const H = 3600_000, D = 24 * H, now = Date.now(), iso = (t) => new Date(t).toISOString();
const A = (title, body, o = {}) => ({ title, body, class_id: null, pinned: false, deadline_at: null, expires_at: null, created_at: iso(now - (o.age ?? H)), ...o.f });
must(await sb.from("announcements").insert([
  A("Wywiadówka – spotkanie z rodzicami", "Czwartek, godz. 17:00 w sali gimnastycznej. Prosimy o punktualność.", { age: 3 * H, f: { pinned: true, deadline_at: iso(now + 3 * D), expires_at: iso(now + 4 * D) } }),
  A("Projekt z matematyki", "Oddajcie projekt z geometrii u pani Tomaszewskiej.", { age: 5 * H, f: { class_id: C["Klasa 7A"], deadline_at: iso(now + D), expires_at: iso(now + 2 * D) } }),
  A("Wycieczka do muzeum", "Zbiórka o 8:00 przed szkołą. Zgody podpisane do piątku.", { age: 8 * H, f: { class_id: C["Klasa 7B"], deadline_at: iso(now + 5 * D) } }),
  A("Zmiana planu zajęć", "WF w poniedziałek odbędzie się w sali nr 2.", { age: 20 * H, f: { class_id: C["Klasa 6A"] } }),
  A("Dzień otwarty szkoły", "Zapraszamy wszystkich zainteresowanych.", { age: 2 * D, f: { deadline_at: iso(now + 10 * D) } }),
  A("Kiermasz ciast (zakończony)", "To ogłoszenie już wygasło.", { age: 4 * D, f: { expires_at: iso(now - H) } }),
]), "announcements");
console.log(`✔ Seed deweloperski gotowy (${url}). Konto testowe: ${EMAIL}`);
