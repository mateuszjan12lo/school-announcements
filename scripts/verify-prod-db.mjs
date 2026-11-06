#!/usr/bin/env node
// Weryfikacja PRODUKCYJNEJ bazy Supabase (uruchom przed wdrożeniem/merge do main):
//   NEXT_PUBLIC_SUPABASE_URL=… NEXT_PUBLIC_SUPABASE_ANON_KEY=… SUPABASE_SERVICE_ROLE_KEY=… npm run verify:prod-db
// Sprawdza, że w bazie NIE istnieje konto deweloperskie, hasła testowe nie działają i nie ma kont *@example.test.
import { createClient } from "@supabase/supabase-js";

const e = process.env, url = e.NEXT_PUBLIC_SUPABASE_URL, anon = e.NEXT_PUBLIC_SUPABASE_ANON_KEY, svc = e.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anon || !svc) { console.error("✖ Brak zmiennych NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY."); process.exit(2); }
const problems = [];
if (!e.VERIFY_ALLOW_LOCAL && /(127\.0\.0\.1|localhost|host\.docker\.internal|\.dev\.|-dev\.)/i.test(url)) problems.push(`Adres wygląda na deweloperski: ${url}`);
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, svc, opts);

const users = []; for (let page = 1; ; page++) { const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 }); if (error) { console.error("✖ " + error.message); process.exit(2); } users.push(...data.users); if (data.users.length < 200) break; }
const dev = users.filter((u) => (u.email ?? "").toLowerCase().endsWith("@example.test"));
for (const u of dev) problems.push(`Istnieje konto deweloperskie: ${u.email}`);
for (const [email, pw] of [["admin@example.test", "admin"], ["admin@example.test", "Admin123!"], ["admin@example.test", "admin123"]]) {
  const r = await createClient(url, anon, opts).auth.signInWithPassword({ email, password: pw });
  if (!r.error) problems.push(`Logowanie ${email} hasłem testowym ZADZIAŁAŁO`);
}
const { data: adm } = await admin.from("admins").select("user_id"); const ids = new Set((adm ?? []).map((a) => a.user_id));
for (const u of dev) if (ids.has(u.id)) problems.push(`Konto deweloperskie ${u.email} jest administratorem`);
if (!ids.size) console.warn("⚠ Brak administratorów w tabeli admins – nikt nie zaloguje się do panelu.");

if (problems.length) { console.error("✖ WERYFIKACJA PRODUKCJI NIEUDANA:\n" + problems.map((p) => "  - " + p).join("\n")); process.exit(1); }
console.log(`✔ Baza produkcyjna czysta: brak kont deweloperskich (sprawdzono ${users.length} kont), hasła testowe odrzucone.`);
