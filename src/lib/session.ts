import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseUser } from "./supabase/server";
import { rejectDevLogin } from "./safety";
import type { AdminUser } from "./types";

/** Zwraca zalogowanego ADMINISTRATORA albo null. Sesję waliduje serwer Supabase (getUser), rolę sprawdza tabela admins pod RLS. */
export async function currentAdmin(): Promise<AdminUser | null> {
  const sb = await supabaseUser();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.rpc("is_admin");
  return data === true ? { id: user.id, email: user.email ?? "" } : null;
}
/** Każda strona i akcja panelu woła tę funkcję – autoryzacja jest po stronie serwera, nie w przyciskach. */
export async function requireAdmin() { const a = await currentAdmin(); if (!a) redirect("/admin/logowanie"); return a; }

// Najlepsza próba ochrony przed zgadywaniem haseł (limit na instancję). Właściwy limit: wbudowany rate limiting Supabase Auth.
const attempts = new Map<string, number[]>();
const WINDOW = 15 * 60_000, MAX = 5;
const clientKey = async () => ((await headers()).get("x-forwarded-for") ?? "local").split(",")[0].trim();

export async function login(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const now = Date.now(), keys = [`e:${email.toLowerCase()}`, `ip:${await clientKey()}`];
  for (const k of keys) { const h = (attempts.get(k) ?? []).filter((t) => now - t < WINDOW); attempts.set(k, h); if (h.length >= MAX) return { ok: false, error: "Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut." }; }
  const fail = () => { for (const k of keys) attempts.set(k, [...(attempts.get(k) ?? []), now]); return { ok: false as const, error: "Nieprawidłowy adres e-mail lub hasło." }; };
  if (rejectDevLogin(email)) return fail(); // produkcja odrzuca konta deweloperskie, zanim zapyta Supabase
  const sb = await supabaseUser();
  const { error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) return fail();
  const { data: isAdmin } = await sb.rpc("is_admin");
  if (isAdmin !== true) { await sb.auth.signOut(); return fail(); } // poprawne konto, ale nie administrator → tak samo jak błędne hasło
  for (const k of keys) attempts.delete(k);
  return { ok: true };
}
export async function logout() { const sb = await supabaseUser(); await sb.auth.signOut(); }
