import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createPlain } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Klient z sesją użytkownika (ciasteczka). Wszystkie zapisy idą tędy – egzekwuje je RLS, nie tylko kod aplikacji. */
export async function supabaseUser() {
  const store = await cookies();
  return createServerClient(url(), anon(), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => { try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* wywołanie z Server Component – odświeżenie robi proxy */ } },
    },
  });
}
/** Klient anonimowy bez sesji – do publicznego odczytu (RLS wpuszcza tylko niewygasłe ogłoszenia). Klucz service_role NIGDY nie jest tu używany. */
export const supabasePublic = () => createPlain(url(), anon(), { auth: { persistSession: false, autoRefreshToken: false } });
